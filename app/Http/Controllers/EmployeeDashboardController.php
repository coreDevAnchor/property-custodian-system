<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Asset;
use App\Models\BorrowRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class EmployeeDashboardController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user();

        $currentPerPage = (int) $request->input('current_per_page', 10);
        $activityPerPage = (int) $request->input('activity_per_page', 5);

        // Two independent paginators on the same page — Laravel keys each by
        // a distinct query-string param name so paging through one table
        // doesn't reset the other.
        $currentBorrows = BorrowRequest::with(['asset.category'])
            ->where('borrower_id', $user->id)
            ->whereIn('status', ['borrowed', 'awaiting_check'])
            ->latest('requested_at')
            ->paginate($currentPerPage, ['*'], 'current_page')
            ->withQueryString();

        $recentActivity = BorrowRequest::with(['asset.category'])
            ->where('borrower_id', $user->id)
            ->latest('requested_at')
            ->paginate($activityPerPage, ['*'], 'activity_page')
            ->withQueryString();

        // Full (unpaginated) list of items the employee can actually return
        // right now, used to populate ReturnRequestDialog. Kept separate
        // from the paginated `currentBorrows` table above so returning an
        // item isn't limited to whichever page happens to be showing.
        $returnableBorrows = BorrowRequest::with(['asset.category'])
            ->where('borrower_id', $user->id)
            ->where('status', 'borrowed')
            ->latest('requested_at')
            ->get();

        return Inertia::render('employee/dashboard', [
            'stats' => [
                'availableAssets' => Asset::where('status', 'available')->count(),
                'activeBorrows' => BorrowRequest::where('borrower_id', $user->id)
                    ->whereIn('status', ['borrowed', 'awaiting_check'])
                    ->count(),
                'pendingRequests' => BorrowRequest::where('borrower_id', $user->id)
                    ->where('status', 'pending')
                    ->count(),
                'totalBorrowed' => BorrowRequest::where('borrower_id', $user->id)->count(),
            ],

            'currentBorrows' => $currentBorrows,
            'recentActivity' => $recentActivity,
            'returnableBorrows' => $returnableBorrows,

            'filters' => [
                'current_per_page' => $currentPerPage,
                'activity_per_page' => $activityPerPage,
            ],
        ]);
    }
}