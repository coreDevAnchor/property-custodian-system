<?php

namespace App\Http\Controllers;

use App\Models\ActivityLogs;
use App\Models\Asset;
use App\Models\BorrowRequest;
use Inertia\Inertia;

class CustodianDashboardController extends Controller
{
    //
    public function index()
    {
        return Inertia::render('custodian/dashboard', [
            'stats' => [
                'totalAssets' => Asset::count(),
                'availableAssets' => Asset::where('status', 'available')->count(),
                'pendingRequests' => BorrowRequest::where('status', 'pending')->count(),
                'awaitingReturns' => BorrowRequest::where('status', 'awaiting_check')->count(),
            ],
            'recentActivity' => ActivityLogs::with(['asset', 'actor'])
                ->latest('created_at')
                ->take(10)
                ->get(),
        ]);
    }
}
