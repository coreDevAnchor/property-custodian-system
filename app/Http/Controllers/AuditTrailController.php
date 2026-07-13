<?php

namespace App\Http\Controllers;

use App\Models\ActivityLogs;
use Inertia\Inertia;

class AuditTrailController extends Controller
{
    public function index()
    {
        return Inertia::render('custodian/audit-trail', [
            'activity' => ActivityLogs::with(['asset', 'actor'])
                ->latest('created_at')
                ->paginate(20),
        ]);
    }
}
