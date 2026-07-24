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
            'checkedBy',
        ])
            ->whereIn('status', ['awaiting_check', 'returned'])

            ->when($search, function ($query) use ($search) {
                $query->where(function ($q) use ($search) {
                    $q->whereHas(
                        'borrower',
                        fn($u) =>
                        $u->where('name', 'like', "%{$search}%")
                    )
                        ->orWhereHas('asset', function ($a) use ($search) {
                            $a->where('name', 'like', "%{$search}%")
                                ->orWhere('asset_tag', 'like', "%{$search}%")
                                ->orWhereHas('assetType', function ($type) use ($search) {
                                    $type->where('name', 'like', "%{$search}%");
                                });
                        });
                });
            })
            ->when($status !== 'All', fn($q) => $q->where('status', $status))
            ->when($sort === 'newest', fn($q) => $q->latest('requested_at'))
            ->when($sort === 'oldest', fn($q) => $q->oldest('requested_at'))
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
     * Handle an employee's return submission from ReturnRequestDialog.
     *
     * `borrow_ids` are items being physically returned (go to
     * `awaiting_check` for custodian inspection). `lost_ids` are items the
     * employee is reporting as lost — since there's nothing to physically
     * inspect, these finalize immediately: the borrow record is marked
     * `returned` with `return_condition = 'lost'`, and the asset itself is
     * flipped to `status = 'lost'`.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'borrow_ids' => ['array'],
            'borrow_ids.*' => ['integer', 'distinct', 'exists:borrows,id'],
            'lost_ids' => ['array'],
            'lost_ids.*' => ['integer', 'distinct', 'exists:borrows,id'],
        ]);

        $returnIds = $validated['borrow_ids'] ?? [];
        $lostIds = $validated['lost_ids'] ?? [];

        if (empty($returnIds) && empty($lostIds)) {
            return back()->withErrors([
                'borrow_ids' => 'Select at least one item to return.',
            ]);
        }

        $user = Auth::user();

        $borrows = BorrowRequest::where('borrower_id', $user->id)
            ->where('status', 'borrowed')
            ->whereIn('id', array_merge($returnIds, $lostIds))
            ->get();

        DB::transaction(function () use ($borrows, $lostIds, $user) {
            foreach ($borrows as $borrow) {
                if (in_array($borrow->id, $lostIds, true)) {
                    $borrow->update([
                        'status' => 'returned',
                        'return_condition' => 'lost',
                        'returned_at' => now(),
                    ]);

                    // Fetch true Eloquent model instance for the asset
                    $asset = Asset::findOrFail($borrow->asset_id);
                    $asset->update(['status' => 'lost']);

                    // Passes true Asset model into record()
                    ActivityLogs::record(
                        $asset,
                        'asset_lost',
                        "{$asset->name} ({$asset->asset_tag}) was reported lost by {$user->name}."
                    );
                } else {
                    $borrow->update([
                        'status' => 'awaiting_check',
                        'returned_at' => now(),
                    ]);
                }
            }
        });

        return back()->with('success', 'Return request submitted.');
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
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        //
    }
}