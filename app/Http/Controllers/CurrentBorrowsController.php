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
        $employee = Auth::user()->employee;

        $status = $request->input('status', 'All');
        $perPage = (int) $request->input('per_page', 12);

        $borrows = BorrowRequest::with(['asset.category', 'asset.location'])
            ->where('employee_id', $employee->id)
            ->whereIn('status', ['pending', 'borrowed', 'awaiting_check'])
            ->when($status !== 'All', fn($q) => $q->where('status', $status))
            ->latest('requested_at')
            ->paginate($perPage)
            ->withQueryString();

        // Counts for the stats row need to reflect the full active set,
        // not just the current filtered/paginated page.
        $counts = BorrowRequest::where('employee_id', $employee->id)
            ->whereIn('status', ['pending', 'borrowed', 'awaiting_check'])
            ->selectRaw('status, count(*) as count')
            ->groupBy('status')
            ->pluck('count', 'status');

        return Inertia::render('employee/current-borrows', [
            'borrows' => $borrows,
            'counts' => [
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