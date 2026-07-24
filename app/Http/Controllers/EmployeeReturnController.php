<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\BorrowRequest;
use Illuminate\Support\Facades\Auth;
use App\Models\ActivityLogs;
use App\Models\Asset;
use Illuminate\Support\Facades\DB;

class EmployeeReturnController extends Controller
{
    /**
     * Employee submits one or more currently-borrowed items for return.
     *
     * `borrow_ids` — items being physically returned; go to `awaiting_check`
     * so a custodian can inspect and confirm condition.
     *
     * `lost_ids` — items the employee cannot return because they are lost;
     * these go to `awaiting_check` with `return_condition = lost` so the
     * custodian can confirm and officially close them out.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'borrow_ids'   => ['array'],
            'borrow_ids.*' => ['integer', 'distinct', 'exists:borrows,id'],
            'lost_ids'     => ['array'],
            'lost_ids.*'   => ['integer', 'distinct', 'exists:borrows,id'],
        ]);

        $returnIds = $validated['borrow_ids'] ?? [];
        $lostIds   = $validated['lost_ids'] ?? [];

        if (empty($returnIds) && empty($lostIds)) {
            return back()->withErrors([
                'borrow_ids' => 'Select at least one item to return.',
            ]);
        }

        $user = Auth::user();

        $borrows = BorrowRequest::with('asset')
            ->where('borrower_id', $user->id)
            ->where('status', 'borrowed')
            ->whereIn('id', array_merge($returnIds, $lostIds))
            ->get();

        if ($borrows->isEmpty()) {
            return back()->withErrors([
                'borrow_ids' => 'No valid borrowed items were selected.',
            ]);
        }

        DB::transaction(function () use ($borrows, $lostIds, $user) {
            foreach ($borrows as $borrow) {
                if (in_array($borrow->id, $lostIds, true)) {
                    // Reported lost — custodian must still confirm before
                    // the asset status is officially set to lost.
                    $borrow->update([
                        'status'           => 'awaiting_check',
                        'return_condition' => 'lost',
                        'returned_at'      => now(),
                    ]);

                    ActivityLogs::record(
                        $borrow->asset,
                        'return_submitted',
                        "{$user->name} reported {$borrow->asset->name} ({$borrow->asset->asset_tag}) as lost."
                    );
                } else {
                    // Normal return — awaiting custodian inspection.
                    $borrow->update([
                        'status'      => 'awaiting_check',
                        'returned_at' => now(),
                    ]);

                    ActivityLogs::record(
                        $borrow->asset,
                        'return_submitted',
                        "{$user->name} submitted {$borrow->asset->name} for return inspection."
                    );
                }
            }
        });

        $count = $borrows->count();

        return back()->with('success', $count > 1
            ? "{$count} items submitted for return."
            : 'Item submitted for return.');
    }
}
