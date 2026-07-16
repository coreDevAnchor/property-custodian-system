<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\BorrowRequest;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class CurrentBorrowsController extends Controller
{
    public function index()
    {
        $employee = Auth::user()->employee;

        $activeBorrows = BorrowRequest::with(['asset.category', 'asset.location'])
            ->where('employee_id', $employee->id)
            ->whereIn('status', ['pending', 'borrowed', 'awaiting_check'])
            ->latest('requested_at')
            ->get();

        return Inertia::render('employee/current-borrows', [
            'borrows' => $activeBorrows,
        ]);
    }
}
