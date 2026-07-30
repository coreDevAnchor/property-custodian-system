<?php

namespace App\Http\Controllers;

use App\Models\ActivityLogs;
use App\Models\BorrowRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use App\Models\Asset;
use Illuminate\Support\Facades\DB;

class ReturnController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $search = $request->string('search')->toString();
        $status = $request->input('status', 'awaiting_check');
        $sort = $request->input('sort', 'newest');
        $perPage = (int) $request->input('per_page', 10);

        $returns = BorrowRequest::with([
            'asset.category',
            'borrower',
            'approvedBy',
            'checkedBy',
        ])
            ->whereIn('status', ['awaiting_check', 'returned'])

            ->when($search, function ($query) use ($search) {
                $query->where(function ($q) use ($search) {
                    $q->whereHas(
                        'borrower',
                        fn($u) =>
                        $u->where('name', 'ilike', "%{$search}%")
                    )
                        ->orWhereHas('asset', function ($a) use ($search) {
                            $a->where('name', 'ilike', "%{$search}%")
                                ->orWhere('asset_tag', 'ilike', "%{$search}%")
                                ->orWhereHas('assetType', function ($type) use ($search) {
                                    $type->where('name', 'ilike', "%{$search}%");
                                });
                        });
                });
            })
            ->when($status !== 'All', fn($q) => $q->where('status', $status))
            ->when(
                $sort === 'newest',
                fn($q) => $q
                    ->orderByRaw('returned_at IS NULL ASC')
                    ->orderBy('returned_at', 'desc')
            )
            ->when(
                $sort === 'oldest',
                fn($q) => $q
                    ->orderByRaw('returned_at IS NULL ASC')
                    ->orderBy('returned_at', 'asc')
            )
            ->when($sort === 'borrower_az', fn($q) => $q->join('users', 'users.id', '=', 'borrows.borrower_id')
                ->orderBy('users.name', 'asc')
                ->select('borrows.*'))
            ->when($sort === 'borrower_za', fn($q) => $q->join('users', 'users.id', '=', 'borrows.borrower_id')
                ->orderBy('users.name', 'desc')
                ->select('borrows.*'))
            ->paginate($perPage)
            ->withQueryString();

        $awaitingCount = BorrowRequest::where('status', 'awaiting_check')->count();

        return Inertia::render('custodian/returns', [
            'returns' => $returns,
            'awaitingCount' => $awaitingCount,
            'filters' => [
                'search' => $search,
                'status' => $status,
                'sort' => $sort,
                'per_page' => $perPage,
            ],
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Handle an employee's return submission.
     *
     * Normal returns:
     * - The borrowed assets are moved to `awaiting_check`.
     * - The custodian must inspect and confirm the returned condition.
     *
     * Lost reports:
     * - The employee submits a reason for the lost asset.
     * - The borrow record is moved to `awaiting_check`.
     * - `return_condition` is set to `lost`.
     * - The employee's reason is stored in `lost_reason`.
     * - The asset itself is NOT marked as lost yet.
     * - The custodian must review and confirm the lost report.
     */
    public function store(Request $request)
    {
        if ($request->filled('borrow_id')) {
            $validated = $request->validate([
                'borrow_id' => [
                    'required',
                    'integer',
                    'exists:borrows,id',
                ],
                'reason' => [
                    'required',
                    'string',
                    'min:10',
                    'max:1000',
                ],
            ]);
            $user = Auth::user();
            $borrow = BorrowRequest::with('asset')
                ->where('id', $validated['borrow_id'])
                ->where('borrower_id', $user->id)
                ->where('status', 'borrowed')
                ->firstOrFail();

            $borrow->update([
                'status' => 'awaiting_check',
                'return_condition' => 'lost',
                'returned_at' => now(),
                'lost_reason' => $validated['reason'],
            ]);

            ActivityLogs::record(
                $borrow->asset,
                'asset_lost_reported',
                "{$borrow->asset->name} ({$borrow->asset->asset_tag}) was reported lost by {$user->name}.",
                [
                    'borrow_request_id' => $borrow->id,
                    'reason' => $validated['reason'],
                ]
            );

            return back()->with(
                'success',
                'Lost asset report submitted successfully. The custodian will review your report.'
            );
        }
        $validated = $request->validate([
            'borrow_ids' => ['array'],
            'borrow_ids.*' => [
                'integer',
                'distinct',
                'exists:borrows,id',
            ],
        ]);

        $returnIds = $validated['borrow_ids'] ?? [];

        if (empty($returnIds)) {
            return back()->withErrors([
                'borrow_ids' => 'Select at least one item to return.',
            ]);
        }

        $user = Auth::user();

        $borrows = BorrowRequest::where('borrower_id', $user->id)
            ->where('status', 'borrowed')
            ->whereIn('id', $returnIds)
            ->get();

        DB::transaction(function () use ($borrows) {
            foreach ($borrows as $borrow) {
                $borrow->update([
                    'status' => 'awaiting_check',
                    'returned_at' => now(),
                ]);
            }
        });

        return back()->with(
            'success',
            'Return request submitted successfully.'
        );
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $validated = $request->validate([
            'return_condition' => [
                'required',
                'in:ok,defective,lost',
            ],
        ]);

        $custodian = Auth::user();

        $borrow = BorrowRequest::with('asset')
            ->where('id', $id)
            ->where('status', 'awaiting_check')
            ->firstOrFail();

        DB::transaction(function () use ($borrow, $validated, $custodian) {
            $condition = $validated['return_condition'];

            $borrow->update([
                'status' => 'returned',
                'return_condition' => $condition,
                'checked_by' => $custodian->id,
                'approved_at' => now(),
            ]);

            if ($condition === 'lost') {
                $borrow->asset->update([
                    'status' => 'lost',
                ]);

                ActivityLogs::record(
                    $borrow->asset,
                    'asset_marked_lost',
                    "{$borrow->asset->name} ({$borrow->asset->asset_tag}) was confirmed as lost by {$custodian->name}.",
                    [
                        'borrow_request_id' => $borrow->id,
                        'lost_reason' => $borrow->lost_reason,
                        'checked_by' => $custodian->id,
                    ]
                );
            }

            if ($condition === 'defective') {
                $borrow->asset->update([
                    'status' => 'defective',
                ]);

                ActivityLogs::record(
                    $borrow->asset,
                    'asset_returned_defective',
                    "{$borrow->asset->name} ({$borrow->asset->asset_tag}) was returned in defective condition and confirmed by {$custodian->name}.",
                    [
                        'borrow_request_id' => $borrow->id,
                        'checked_by' => $custodian->id,
                    ]
                );
            }

            if ($condition === 'ok') {
                $borrow->asset->update([
                    'status' => 'available',
                ]);

                ActivityLogs::record(
                    $borrow->asset,
                    'asset_returned',
                    "{$borrow->asset->name} ({$borrow->asset->asset_tag}) was returned in good condition and confirmed by {$custodian->name}.",
                    [
                        'borrow_request_id' => $borrow->id,
                        'checked_by' => $custodian->id,
                    ]
                );
            }
        });

        return back()->with(
            'success',
            match ($validated['return_condition']) {
                'ok' => 'Return confirmed. Asset is now available.',
                'defective' => 'Return confirmed. Asset has been marked as defective.',
                'lost' => 'Lost asset report confirmed. Asset has been marked as lost.',
            }
        );
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        //
    }
}