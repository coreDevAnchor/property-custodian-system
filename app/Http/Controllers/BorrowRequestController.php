<?php

namespace App\Http\Controllers;

use App\Models\ActivityLogs;
use App\Models\Asset;
use App\Models\BorrowRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class BorrowRequestController extends Controller
{
    public function index(Request $request): Response
    {
        $search = $request->string('search')->toString();
        $status = $request->input('status', 'pending');
        $sort = $request->input('sort', 'newest');
        $perPage = (int) $request->input('per_page', 10);

        $borrowRequests = BorrowRequest::with([
            'asset.category',
            'borrower',
            'approvedBy',
            'checkedBy',
        ])
            ->when($search, function ($query) use ($search) {
                    $query->where(function ($q) use ($search) {
                        $q->whereHas('borrower', fn($u) =>
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
            ->when($sort === 'newest', fn($q) => $q->latest('requested_at'))
            ->when($sort === 'oldest', fn($q) => $q->oldest('requested_at'))
            ->when($sort === 'requester_az', fn($q) => $q->join('users', 'users.id', '=', 'borrow_requests.borrower_id')
                ->orderBy('users.name', 'asc')
                ->select('borrow_requests.*'))
            ->when($sort === 'requester_za', fn($q) => $q->join('users', 'users.id', '=', 'borrow_requests.borrower_id')
                ->orderBy('users.name', 'desc')
                ->select('borrow_requests.*'))
            ->paginate($perPage)
            ->withQueryString();

        $pendingCount = BorrowRequest::where('status', 'pending')->count();

        return Inertia::render('custodian/borrow-requests', [
            'borrowRequests' => $borrowRequests,
            'pendingCount' => $pendingCount,
            'filters' => [
                'search' => $search,
                'status' => $status,
                'sort' => $sort,
                'per_page' => $perPage,
            ],
        ]);
    }

    public function create(): void
    {
        //
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'asset_id' => ['required', 'exists:assets,id'],
            'expected_return_date' => ['required', 'date', 'after_or_equal:today'],
            'remarks' => ['nullable', 'string'],
        ]);

        $asset = Asset::query()->find((int) $validated['asset_id']);

        if (!$asset instanceof Asset) {
            abort(404);
        }

        if ($asset->status !== 'available') {
            return back()->with('error', 'This asset is not available for borrowing.');
        }

        $user = Auth::user();

        if (!$user instanceof User) {
            abort(403);
        }

        $hasDuplicate = BorrowRequest::where('asset_id', $asset->id)
            ->where('borrower_id', $user->id)
            ->whereIn('status', ['pending', 'borrowed', 'awaiting_check'])
            ->exists();

        if ($hasDuplicate) {
            return back()->with('error', "You can't duplicate a borrow request.");
        }

        BorrowRequest::create([
            'asset_id' => $asset->id,
            'employee_id' => $user->employee?->id,
            'borrower_id' => $user->id,
            'status' => 'pending',
            'requested_at' => now(),
            'expected_return_date' => $validated['expected_return_date'],
            'remarks' => $validated['remarks'] ?? null,
        ]);

        ActivityLogs::record(
            $asset,
            'borrow_requested',
            "{$user->name} requested to borrow {$asset->name}."
        );

        return redirect()
            ->route('employee.assets.index')
            ->with('success', 'Borrow request submitted successfully.');
    }

    public function show(string $id): JsonResponse
    {
        $borrowRequest = BorrowRequest::with([
            'asset.category',
            'asset.location',
            'borrower',
            'approvedBy',
            'checkedBy',
        ])->findOrFail($id);

        return response()->json($borrowRequest);
    }

    public function edit(string $id): JsonResponse
    {
        $borrowRequest = BorrowRequest::with([
            'asset.category',
            'asset.location',
            'borrower',
            'approvedBy',
            'checkedBy',
        ])->findOrFail($id);

        return response()->json($borrowRequest);
    }

    public function update(Request $request, string $id): RedirectResponse
    {
        $validated = $request->validate([
            'status' => [
                'required',
                'in:pending,borrowed,awaiting_check,returned,rejected',
            ],
            'remarks' => ['nullable', 'string'],
            'return_condition' => ['nullable', 'in:ok,defective'],
            'expected_return_date' => ['nullable', 'date', 'after_or_equal:today'],
        ]);

        $borrowRequest = BorrowRequest::with(['asset', 'borrower'])->findOrFail($id);
        $wasPending = $borrowRequest->status === 'pending';
        $asset = $borrowRequest->asset;
        $requesterName = $borrowRequest->borrower->name;

        if (
            $validated['status'] === 'borrowed' &&
            $wasPending &&
            $asset->status !== 'available'
        ) {
            return back()->with(
                'error',
                'This asset has already been borrowed by another employee.'
            );
        }

        $updateData = [
            'remarks' => $validated['remarks'] ?? $borrowRequest->remarks,
            'return_condition' => $validated['return_condition'] ?? $borrowRequest->return_condition,
            'expected_return_date' => $borrowRequest->expected_return_date,
        ];

        if ($validated['status'] === 'borrowed') {
            $updateData['approved_by'] = Auth::id();
            $updateData['approved_at'] = now();
            if (!empty($validated['expected_return_date'])) {
                $updateData['expected_return_date'] = $validated['expected_return_date'];
            }
        } elseif ($validated['status'] === 'returned') {
            $updateData['checked_by'] = Auth::id();
            $updateData['returned_at'] = now();
        }

        $borrowRequest->update([
            'status' => $validated['status'],
        ] + $updateData);

        if ($validated['status'] === 'borrowed') {
            $asset->update([
                'status' => 'borrowed',
            ]);
        }

        if ($validated['status'] === 'returned') {
            $asset->update([
                'status' => $validated['return_condition'] === 'defective'
                    ? 'under_repair'
                    : 'available',
            ]);
        }

        $message = match (true) {
            $validated['status'] === 'borrowed' && $wasPending => 'The request has been approved.',
            $validated['status'] === 'rejected' => 'The request has been rejected.',
            $validated['status'] === 'awaiting_check' => 'Item marked as awaiting check.',
            $validated['status'] === 'returned' => 'Return confirmed successfully.',
            default => 'Borrow request updated successfully.',
        };

        $logAction = match (true) {
            $validated['status'] === 'borrowed' && $wasPending => 'borrow_approved',
            $validated['status'] === 'rejected' => 'borrow_rejected',
            $validated['status'] === 'awaiting_check' => 'return_submitted',
            $validated['status'] === 'returned' => 'return_inspected',
            default => 'borrow_updated',
        };

        $logDescription = match (true) {
            $validated['status'] === 'borrowed' && $wasPending => "Borrow request from {$requesterName} was approved.",
            $validated['status'] === 'rejected' => "Borrow request from {$requesterName} was rejected.",
            $validated['status'] === 'awaiting_check' => "{$requesterName} submitted {$asset->name} for return inspection.",
            $validated['status'] === 'returned' => "{$asset->name} was inspected and confirmed returned"
            . ($updateData['return_condition'] ? " ({$updateData['return_condition']})." : '.'),
            default => "Borrow request status changed to {$validated['status']}.",
        };

        ActivityLogs::record($asset, $logAction, $logDescription, [
            'borrow_request_id' => $borrowRequest->id,
            'status' => $validated['status'],
        ]);

        $toastType = $validated['status'] === 'rejected' ? 'error' : 'success';

        return redirect()
            ->back()
            ->with($toastType, $message);
    }

    public function destroy(string $id): RedirectResponse
    {
        BorrowRequest::destroy($id);

        return redirect()
            ->route('custodian.borrow-requests.index')
            ->with('success', 'Borrow request deleted successfully.');
    }
}
