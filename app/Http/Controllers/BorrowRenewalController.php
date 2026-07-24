<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\BorrowRenewal;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class BorrowRenewalController extends Controller
{
    //
    public function store(Request $request)
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
}
