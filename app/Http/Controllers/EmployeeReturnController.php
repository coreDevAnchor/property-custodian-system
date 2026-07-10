<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\BorrowRequest;
use Illuminate\Support\Facades\Auth;

class EmployeeReturnController extends Controller
{
    /**
     * Employee submits one or more currently-borrowed items for return.
     * Marks them as awaiting_check so a custodian can confirm condition.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'borrow_ids' => ['required', 'array', 'min:1'],
            'borrow_ids.*' => ['integer', 'exists:borrows,id'],
        ]);

        $employee = Auth::user()->employee;

        if (!$employee) {
            abort(403, 'Only employees can submit returns.');
        }

        $borrows = BorrowRequest::whereIn('id', $validated['borrow_ids'])
            ->where('employee_id', $employee->id)
            ->where('status', 'borrowed')
            ->get();

        if ($borrows->isEmpty()) {
            return back()->withErrors([
                'borrow_ids' => 'No valid borrowed items were selected.',
            ]);
        }

        foreach ($borrows as $borrow) {
            $borrow->update([
                'status' => 'awaiting_check',
            ]);
        }

        return redirect()
            ->route('employee.dashboard')
            ->with('success', $borrows->count() > 1
                ? $borrows->count() . ' items submitted for return.'
                : 'Item submitted for return.');
    }
}
