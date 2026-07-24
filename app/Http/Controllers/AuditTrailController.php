<?php

namespace App\Http\Controllers;

use App\Models\ActivityLogs;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AuditTrailController extends Controller
{
    private const CATEGORY_ACTIONS = [
        'assets' => ['asset_created', 'asset_updated', 'asset_deleted', 'asset_disposed', 'asset_repair_flagged', 'asset_lost'],
        'borrow_requests' => ['borrow_requested', 'borrow_approved', 'borrow_rejected', 'borrow_updated'],
        'returns' => ['return_submitted', 'return_inspected'],
        'employees' => ['employee_created', 'employee_updated', 'employee_deleted'],
        'custodians' => ['custodian_created', 'custodian_updated', 'custodian_deleted'],
    ];

    public function index(Request $request)
    {
        $category = $request->input('category', 'All');
        $range = $request->input('range', 'all');
        $perPage = (int) $request->input('per_page', 20);

        $query = ActivityLogs::with(['asset', 'actor']);

        if ($category !== 'All' && isset(self::CATEGORY_ACTIONS[$category])) {
            $query->whereIn('action', self::CATEGORY_ACTIONS[$category]);
        }

        match ($range) {
            '24h' => $query->where('created_at', '>=', now()->subDay()),
            '7d' => $query->where('created_at', '>=', now()->subDays(7)),
            '30d' => $query->where('created_at', '>=', now()->subDays(30)),
            default => null, // 'all' — no date constraint
        };

        $activity = $query
            ->latest('created_at')
            ->paginate($perPage)
            ->withQueryString();

        return Inertia::render('custodian/audit-trail', [
            'activity' => $activity,
            'filters' => [
                'category' => $category,
                'range' => $range,
                'per_page' => $perPage,
            ],
        ]);
    }
}