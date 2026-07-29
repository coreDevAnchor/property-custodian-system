<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\BorrowRequest;
use Illuminate\Support\Facades\Auth;
use App\Models\ActivityLogs;
use Illuminate\Support\Facades\DB;

class EmployeeReturnController extends Controller
{
    /**
     * Employee submits one or more items for return.
     *
     * Normal returns:
     * - status => awaiting_check
     * - return_condition remains null
     *
     * Lost reports:
     * - status => awaiting_check
     * - return_condition => lost
     * - lost_reason => employee's explanation
     *
     * The asset itself is NOT marked as lost yet.
     * The custodian must confirm the lost report first.
     */
    public function store(Request $request)
    {
        /*
        | Lost Asset Report
        */
        if ($request->filled('lost_id')) {
            $validated = $request->validate([
                'lost_id' => [
                    'required',
                    'integer',
                    'exists:borrows,id',
                ],
                'lost_reason' => [
                    'required',
                    'string',
                    'min:10',
                    'max:1000',
                ],
            ]);

            $user = Auth::user();

            $borrow = BorrowRequest::with('asset')
                ->where('id', $validated['lost_id'])
                ->where('borrower_id', $user->id)
                ->where('status', 'borrowed')
                ->firstOrFail();

            DB::transaction(function () use ($borrow, $validated, $user) {
                $borrow->update([
                    'status' => 'awaiting_check',
                    'return_condition' => 'lost',
                    'returned_at' => now(),
                    'lost_reason' => $validated['lost_reason'],
                ]);

                ActivityLogs::record(
                    $borrow->asset,
                    'asset_lost_reported',
                    "{$user->name} reported {$borrow->asset->name} ({$borrow->asset->asset_tag}) as lost.",
                    [
                        'borrow_request_id' => $borrow->id,
                        'lost_reason' => $validated['lost_reason'],
                    ]
                );
            });

            return back()->with(
                'success',
                'Lost asset report submitted successfully. The custodian will review your report.'
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Normal Return Submission
        |--------------------------------------------------------------------------
        */
        $validated = $request->validate([
            'borrow_ids' => ['array'],
            'borrow_ids.*' => [
                'integer',
                'distinct',
                'exists:borrows,id',
            ],
        ]);

        $returnIds = $validated['borrow_ids'] ?? [];

        if (empty($returnIds)) {
            return back()->withErrors([
                'borrow_ids' => 'Select at least one item to return.',
            ]);
        }

        $user = Auth::user();

        $borrows = BorrowRequest::with('asset')
            ->where('borrower_id', $user->id)
            ->where('status', 'borrowed')
            ->whereIn('id', $returnIds)
            ->get();

        if ($borrows->isEmpty()) {
            return back()->withErrors([
                'borrow_ids' => 'No valid borrowed items were selected.',
            ]);
        }

        DB::transaction(function () use ($borrows, $user) {
            foreach ($borrows as $borrow) {
                $borrow->update([
                    'status' => 'awaiting_check',
                    'returned_at' => now(),
                ]);

                ActivityLogs::record(
                    $borrow->asset,
                    'return_submitted',
                    "{$user->name} submitted {$borrow->asset->name} ({$borrow->asset->asset_tag}) for return inspection.",
                    [
                        'borrow_request_id' => $borrow->id,
                    ]
                );
            }
        });

        $count = $borrows->count();

        return back()->with(
            'success',
            $count > 1
            ? "{$count} items submitted for return."
            : 'Item submitted for return.'
        );
    }

}