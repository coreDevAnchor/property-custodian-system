<?php

namespace App\Http\Controllers;

use App\Models\ActivityLogs;
use App\Models\Asset;
use App\Models\BorrowRequest;
use App\Models\BorrowRenewal;
use App\Models\User;
use App\Notifications\ManualOverdueReminderNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;
use App\Notifications\BorrowRequestStatusNotification;

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
            ->when($sort === 'newest', fn($q) => $q->latest('requested_at'))
            ->when($sort === 'oldest', fn($q) => $q->oldest('requested_at'))
            ->when($sort === 'requester_az', fn($q) => $q->join('users', 'users.id', '=', 'borrows.borrower_id')
                ->orderBy('users.name', 'asc')
                ->select('borrows.*'))
            ->when($sort === 'requester_za', fn($q) => $q->join('users', 'users.id', '=', 'borrows.borrower_id')
                ->orderBy('users.name', 'desc')
                ->select('borrows.*'))
            ->paginate($perPage)
            ->withQueryString();

        $pendingCount = BorrowRequest::where('status', 'pending')->count();
        $renewalRequests = BorrowRenewal::with([
            'borrow.asset.category',
            'borrow.borrower',
        ])
            ->where('status', 'pending')
            ->latest()
            ->get();

        return Inertia::render('custodian/borrow-requests', [
            'borrowRequests' => $borrowRequests,
            'pendingCount' => $pendingCount,
            'renewalRequests' => $renewalRequests,
            'pendingRenewalCount' => $renewalRequests->count(),
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
            'borrow_amount' => ['nullable', 'integer', 'min:1'],
        ]);

        $asset = Asset::query()->find((int) $validated['asset_id']);

        if (!$asset instanceof Asset) {
            abort(404);
        }

        $isMultiUnit = $asset->category?->unit_type === 'multi';
        $borrowQty = $isMultiUnit ? ($validated['borrow_amount'] ?? 1) : 1;

        if ($isMultiUnit) {
            if ($asset->amount < $borrowQty) {
                return back()->with('error', "Only {$asset->amount} units available.");
            }
        } else {
            if ($asset->status !== 'available') {
                return back()->with('error', 'This asset is not available for borrowing.');
            }
        }

        $user = Auth::user();

        if (!$user instanceof User) {
            abort(403);
        }

        if (!$isMultiUnit) {
            $hasDuplicate = BorrowRequest::where('asset_id', $asset->id)
                ->where('borrower_id', $user->id)
                ->whereIn('status', ['pending', 'borrowed', 'awaiting_check'])
                ->exists();

            if ($hasDuplicate) {
                return back()->with('error', "You can't duplicate a borrow request.");
            }
        }

        BorrowRequest::create([
            'asset_id' => $asset->id,
            'employee_id' => $user->employee?->id,
            'borrower_id' => $user->id,
            'status' => 'pending',
            'requested_at' => now(),
            'expected_return_date' => $validated['expected_return_date'],
            'remarks' => $validated['remarks'] ?? null,
            'borrow_amount' => $borrowQty,
        ]);

        ActivityLogs::record(
            $asset,
            'borrow_requested',
            "{$user->name} requested to borrow {$asset->name}" . ($isMultiUnit ? " (x{$borrowQty})." : ".")
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
            'return_condition' => ['nullable', 'in:ok,defective,lost'],
            'expected_return_date' => ['nullable', 'date', 'after_or_equal:today'],
            'rejection_message' => ['nullable', 'string'],
        ]);

        $borrowRequest = BorrowRequest::with(['asset', 'borrower'])->findOrFail($id);
        $wasPending = $borrowRequest->status === 'pending';
        $asset = $borrowRequest->asset;
        $requesterName = $borrowRequest->borrower->name;
        $custodian = Auth::user();

        if (!$custodian instanceof User) {
            abort(403);
        }

        if (
            $validated['status'] === 'borrowed' &&
            $wasPending
        ) {
            $isMultiUnit = $asset->category?->unit_type === 'multi';
            $borrowQty = $borrowRequest->borrow_amount ?? 1;

            if ($isMultiUnit) {
                if ($asset->amount < $borrowQty) {
                    return back()->with(
                        'error',
                        "Insufficient stock. Only {$asset->amount} units available."
                    );
                }
            } else {
                if ($asset->status !== 'available') {
                    return back()->with(
                        'error',
                        'This asset has already been borrowed by another employee.'
                    );
                }
            }
        }

        $updateData = [
            'remarks' => $validated['remarks'] ?? $borrowRequest->remarks,
            'return_condition' => $validated['return_condition'] ?? $borrowRequest->return_condition,
            'expected_return_date' => $borrowRequest->expected_return_date,
        ];

        if ($validated['status'] === 'borrowed') {
            $updateData['approved_by'] = $custodian->id;
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

        $borrowRequest->load('asset');

        if (in_array($validated['status'], ['borrowed', 'rejected'])) {
            $borrowRequest->borrower->notify(
                new BorrowRequestStatusNotification(
                    $borrowRequest,
                    $validated['rejection_message'] ?? null,
                    $custodian->name,
                )
            );
        }

        if ($validated['status'] === 'returned') {
        $borrowRequest->borrower->notify(
            new ReturnConfirmedNotification(
                $borrowRequest->asset->name,
                $borrowRequest->return_condition ?? 'ok',
            )
        );
    }

        if ($validated['status'] === 'borrowed') {
            $isMultiUnit = $asset->category?->unit_type === 'multi';
            $borrowQty = $borrowRequest->borrow_amount ?? 1;

            if ($isMultiUnit) {
                $newAmount = max(0, $asset->amount - $borrowQty);
                $asset->update([
                    'amount' => $newAmount,
                    'status' => $newAmount === 0 ? 'borrowed' : $asset->status,
                ]);
            } else {
                $asset->update([
                    'status' => 'borrowed',
                ]);
            }
        }

        if ($validated['status'] === 'returned') {
            $isMultiUnit = $asset->category?->unit_type === 'multi';
            $borrowQty = $borrowRequest->borrow_amount ?? 1;

            if ($isMultiUnit) {
                $newAmount = $asset->amount + $borrowQty;
                $asset->update([
                    'amount' => $newAmount,
                    'status' => 'available',
                ]);
            }
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
            $validated['status'] === 'returned' && ($validated['return_condition'] ?? null) === 'lost' => 'asset_lost',
            $validated['status'] === 'returned' => 'return_inspected',
            default => 'borrow_updated',
        };

        $logDescription = match (true) {
            $validated['status'] === 'borrowed' && $wasPending => "Borrow request from {$requesterName} was approved.",
            $validated['status'] === 'rejected' => "Borrow request from {$requesterName} was rejected.",
            $validated['status'] === 'awaiting_check' => "{$requesterName} submitted {$asset->name} for return inspection.",
            $validated['status'] === 'returned' && ($validated['return_condition'] ?? null) === 'lost' => "{$asset->name} ({$asset->asset_tag}) was confirmed lost by custodian.",
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

    public function sendOverdueReminder(BorrowRequest $borrowRequest): RedirectResponse
    {
        $borrowRequest->load(['asset', 'borrower']);

        if ($borrowRequest->status !== 'borrowed') {
            return back()->with('error', 'This borrow request is no longer active.');
        }

        $borrowRequest->borrower->notify(
            new ManualOverdueReminderNotification(
                $borrowRequest,
                Auth::user(),
            )
        );

        return back()->with(
            'success',
            'Reminder sent successfully.'
        );
    }

    public function destroy(string $id): RedirectResponse
    {
        BorrowRequest::destroy($id);

        return redirect()
            ->route('custodian.borrow-requests.index')
            ->with('success', 'Borrow request deleted successfully.');
    }
}
