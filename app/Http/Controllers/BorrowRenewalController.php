<?php

namespace App\Http\Controllers;

use App\Models\ActivityLogs;
use App\Models\BorrowRenewal;
use App\Models\BorrowRequest;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class BorrowRenewalController extends Controller
{
    public function update(Request $request, BorrowRenewal $borrowRenewal): RedirectResponse
    {
        $validated = $request->validate([
            'status' => ['required', 'in:approved,rejected'],
        ]);

        if ($borrowRenewal->status !== 'pending') {
            return back()->with('error', 'This renewal request has already been processed.');
        }

        $user = Auth::user();

        if (!$user instanceof User) {
            abort(403);
        }

        $borrow = BorrowRequest::with('asset')->findOrFail($borrowRenewal->borrow_id);

        $borrowRenewal->update([
            'status' => $validated['status'],
            'approved_by' => $user->id,
            'approved_at' => now(),
        ]);

        $asset = $borrow->asset;
        $borrowerName = $borrow->borrower?->name ?? 'Unknown';

        if ($validated['status'] === 'approved') {
            $borrow->update([
                'expected_return_date' => $borrowRenewal->requested_due_date,
            ]);

            ActivityLogs::record(
                $asset,
                'renewal_approved',
                "Renewal request from {$borrowerName} for {$asset->name} was approved. New return date: {$borrowRenewal->requested_due_date->format('M d, Y')}.",
                ['borrow_renewal_id' => $borrowRenewal->id, 'status' => 'approved'],
            );
        } else {
            ActivityLogs::record(
                $asset,
                'renewal_rejected',
                "Renewal request from {$borrowerName} for {$asset->name} was rejected.",
                ['borrow_renewal_id' => $borrowRenewal->id, 'status' => 'rejected'],
            );
        }

        $message = $validated['status'] === 'approved'
            ? 'Renewal request approved successfully.'
            : 'Renewal request rejected.';

        return back()->with('success', $message);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'borrow_id' => ['required', 'exists:borrows,id'],
            'requested_due_date' => ['required', 'date', 'after:today'],
            'reason' => ['required', 'string'],
        ]);

        $borrow = BorrowRequest::with('asset')->findOrFail($validated['borrow_id']);

        $user = Auth::user();

        if (!$user instanceof User) {
            abort(403);
        }

        if ($borrow->borrower_id !== $user->id) {
            abort(403);
        }

        if ($borrow->status !== 'borrowed') {
            return back()->with('error', 'Only borrowed items can be renewed.');
        }

        if ($validated['requested_due_date'] <= $borrow->expected_return_date->toDateString()) {
            return back()->with('error', 'The new return date must be later than the current due date.');
        }

        $hasPending = BorrowRenewal::where('borrow_id', $borrow->id)
            ->where('status', 'pending')
            ->exists();

        if ($hasPending) {
            return back()->with('error', 'You already have a pending renewal request for this item.');
        }

        BorrowRenewal::create([
            'borrow_id' => $borrow->id,
            'requested_due_date' => $validated['requested_due_date'],
            'reason' => $validated['reason'],
            'status' => 'pending',
        ]);

        ActivityLogs::record(
            $borrow->asset,
            'renewal_requested',
            "{$user->name} requested to extend the return date for {$borrow->asset->name}."
        );

        return back()->with('success', 'Renewal request submitted successfully.');
    }
}