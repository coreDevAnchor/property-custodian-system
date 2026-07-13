<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\BorrowRequest;
use Inertia\Inertia;
use App\Models\Asset;
use Illuminate\Support\Facades\Auth;
use App\Models\ActivityLogs;

class BorrowRequestController extends Controller
{
    public function index()
    {
        return Inertia::render('custodian/borrow-requests', [
            'borrowRequests' => BorrowRequest::with([
                'asset.category',
                'employee.user',
                'approvedBy',
                'checkedBy',
            ])
                ->latest()
                ->paginate(10),
        ]);
    }

    public function create()
    {
        //
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'asset_id' => ['required', 'exists:assets,id'],
            'remarks' => ['nullable', 'string'],
        ]);

        $asset = Asset::findOrFail($validated['asset_id']);


        if ($asset->status !== 'available') {
            return back()->withErrors([
                'asset_id' => 'This asset is not available for borrowing.',
            ]);
        }

        $existing = BorrowRequest::query()
            ->where('asset_id', $asset->id)
            ->where('employee_id', Auth::user()->employee->id)
            ->where(function ($q) {
                $q->where('status', 'pending')
                    ->orWhere('status', 'borrowed');
            })
            ->exists();

        if ($existing) {
            return back()->withErrors([
                'asset_id' => 'You already have a pending or active request for this asset.',
            ]);
        }

        $employee = Auth::user()->employee;

        if (!$employee) {
            abort(403, 'Only employees can submit borrow requests.');
        }

        BorrowRequest::create([
            'asset_id' => $asset->id,
            'employee_id' => Auth::user()->employee->id,
            'status' => 'pending',
            'requested_at' => now(),
            'remarks' => $validated['remarks'] ?? null,
        ]);

        ActivityLogs::record(
            $asset,
            'borrow_requested',
            "{$employee->user->name} requested to borrow {$asset->name}."
        );

        return redirect()
            ->route('employee.assets.index')
            ->with('success', 'Borrow request submitted successfully.');
    }

    public function show(string $id)
    {
        $borrowRequest = BorrowRequest::with([
            'asset.category',
            'asset.location',
            'employee.user',
            'approvedBy',
            'checkedBy',
        ])->findOrFail($id);

        return response()->json($borrowRequest);
    }

    public function edit(string $id)
    {
        $borrowRequest = BorrowRequest::with([
            'asset.category',
            'asset.location',
            'employee.user',
            'approvedBy',
            'checkedBy',
        ])->findOrFail($id);

        return response()->json($borrowRequest);
    }

    public function update(Request $request, string $id)
    {
        $validated = $request->validate([
            'status' => [
                'required',
                'in:pending,borrowed,awaiting_check,returned,rejected',
            ],
            'remarks' => ['nullable', 'string'],
            'return_condition' => ['nullable', 'in:ok,defective'],
        ]);

        $borrowRequest = BorrowRequest::with('asset')->findOrFail($id);
        $wasPending = $borrowRequest->status === 'pending';
        $asset = $borrowRequest->asset;
        $requesterName = $borrowRequest->employee->user->name;

        $updateData = [
            'remarks' => $validated['remarks'] ?? $borrowRequest->remarks,
            'return_condition' => $validated['return_condition'] ?? $borrowRequest->return_condition,
        ];

        if ($validated['status'] === 'borrowed') {
            $updateData['approved_by'] = Auth::id();
            $updateData['approved_at'] = now();
        } elseif ($validated['status'] === 'returned') {
            $updateData['checked_by'] = Auth::id();
            $updateData['returned_at'] = now();
        }

        $borrowRequest->update([
            'status' => $validated['status'],
        ] + $updateData);

        if ($validated['status'] === 'borrowed') {
            $borrowRequest->asset->update([
                'status' => 'borrowed',
            ]);
        }

        if ($validated['status'] === 'returned') {
            $borrowRequest->asset->update([
                'status' => 'available',
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
            $validated['status'] === 'borrowed' && $wasPending =>
            "Borrow request from {$requesterName} was approved.",
            $validated['status'] === 'rejected' =>
            "Borrow request from {$requesterName} was rejected.",
            $validated['status'] === 'awaiting_check' =>
            "{$requesterName} submitted {$asset->name} for return inspection.",
            $validated['status'] === 'returned' =>
            "{$asset->name} was inspected and confirmed returned"
            . ($updateData['return_condition'] ? " ({$updateData['return_condition']})." : '.'),
            default => "Borrow request status changed to {$validated['status']}.",
        };

        ActivityLogs::record($asset, $logAction, $logDescription, [
            'borrow_request_id' => $borrowRequest->id,
            'status' => $validated['status'],
        ]);

        $toastType = $validated['status'] === 'rejected' ? 'error' : 'success';

        return redirect()
            ->route('custodian.borrow-requests.index')
            ->with($toastType, $message);
    }

    public function destroy(string $id)
    {
        BorrowRequest::destroy($id);

        return redirect()
            ->route('custodian.borrow-requests.index')
            ->with('success', 'Borrow request deleted successfully.');
    }
}
