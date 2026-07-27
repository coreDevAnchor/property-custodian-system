<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\BorrowRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class CurrentBorrowsController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user();

        $status = $request->input('status', 'All');
        $perPage = (int) $request->input('per_page', 12);

        $borrows = BorrowRequest::with(['asset.category', 'asset.location'])
            ->where('borrower_id', $user->id)
            ->whereIn('status', ['pending', 'borrowed', 'awaiting_check'])
            ->when($status !== 'All', fn($q) => $q->where('status', $status))
            ->latest('requested_at')
            ->paginate($perPage)
            ->withQueryString();

        $counts = BorrowRequest::where('borrower_id', $user->id)
            ->whereIn('status', ['pending', 'borrowed', 'awaiting_check'])
            ->selectRaw('status, count(*) as count')
            ->groupBy('status')
            ->pluck('count', 'status')
            ->map(fn($count) => (int) $count);

        return Inertia::render('employee/current-borrows', [
            'borrows' => $borrows,
            'borrowCounts' => [
                'borrowed' => $counts->get('borrowed', 0),
                'pending' => $counts->get('pending', 0),
                'awaiting_check' => $counts->get('awaiting_check', 0),
            ],
            'filters' => [
                'status' => $status,
                'per_page' => $perPage,
            ],
        ]);
    }
}