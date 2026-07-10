<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Asset;
use App\Models\BorrowRequest;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class EmployeeDashboardController extends Controller
{
    public function index()
    {
        $employee = Auth::user()->employee;

        $borrows = BorrowRequest::with(['asset.category'])
            ->where('employee_id', $employee->id)
            ->latest('requested_at')
            ->get();

        return Inertia::render('employee/dashboard', [
            'stats' => [
                'availableAssets' => Asset::where('status', 'available')->count(),
                'activeBorrows' => $borrows
                    ->whereIn('status', ['borrowed', 'awaiting_check'])
                    ->count(),
                'pendingRequests' => $borrows->where('status', 'pending')->count(),
                'totalBorrowed' => $borrows->count(),
            ],

            'currentBorrows' => $borrows
                ->whereIn('status', ['borrowed', 'awaiting_check'])
                ->values(),

            'recentActivity' => $borrows->take(5)->values(),
        ]);
    }
}
