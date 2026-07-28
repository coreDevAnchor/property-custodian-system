<?php

namespace App\Http\Controllers;

use App\Models\BorrowRenewal;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class BorrowRenewalController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'borrow_id' => [
                'required',
                'integer',
                'exists:borrows,id',
            ],
            'requested_due_date' => [
                'required',
                'date',
            ],
            'reason' => [
                'required',
                'string',
                'max:1000',
            ],
        ]);

        $existingRenewal = BorrowRenewal::where(
            'borrow_id',
            $validated['borrow_id']
        )
            ->where('status', 'pending')
            ->exists();

        if ($existingRenewal) {
            return back()->with(
                'error',
                'You already have a pending renewal request for this borrowed asset.'
            );
        }

        BorrowRenewal::create([
            'borrow_id' => $validated['borrow_id'],
            'requested_due_date' => $validated['requested_due_date'],
            'reason' => $validated['reason'],
            'status' => 'pending',
        ]);

        return back()->with(
            'success',
            'Renewal request submitted successfully. Please wait for custodian approval.'
        );
    }

    public function update(Request $request, BorrowRenewal $borrowRenewal): RedirectResponse
    {
        $validated = $request->validate([
            'status' => ['required', 'in:approved,rejected'],
        ]);

        if ($borrowRenewal->status !== 'pending') {
            return back()->with('error', 'This renewal request has already been reviewed.');
        }

        $borrowRenewal->load('borrow');

        if ($borrowRenewal->borrow->status !== 'borrowed') {
            return back()->with('error', 'Only active borrows can be renewed.');
        }

        $borrowRenewal->update([
            'status' => $validated['status'],
            'approved_by' => Auth::id(),
            'approved_at' => now(),
        ]);

        if ($validated['status'] === 'approved') {
            $borrowRenewal->borrow->update([
                'expected_return_date' => $borrowRenewal->requested_due_date,
            ]);
        }

        return back()->with(
            'success',
            $validated['status'] === 'approved'
                ? 'Renewal request approved and return date updated.'
                : 'Renewal request rejected.'
        );
    }
}
