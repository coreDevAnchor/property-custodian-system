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
        $user = Auth::user();

        $borrows = BorrowRequest::with(['asset.category'])
            ->where('borrower_id', $user->id)
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
