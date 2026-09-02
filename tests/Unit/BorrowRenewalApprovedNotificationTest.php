<?php

use App\Models\Asset;
use App\Models\BorrowRenewal;
use App\Models\BorrowRequest;
use App\Models\User;
use App\Notifications\BorrowRenewalApprovedNotification;

test('approved extension notifications include the new return date and custodian', function () {
    $asset = new Asset([
        'name' => 'Logitech Mouse',
        'asset_tag' => 'AST-00007',
    ]);
    $borrow = new BorrowRequest(['asset_id' => $asset->id]);
    $borrow->id = 12;
    $borrow->setRelation('asset', $asset);
    $renewal = new BorrowRenewal([
        'requested_due_date' => '2026-09-01',
    ]);
    $renewal->id = 24;

    $notification = new BorrowRenewalApprovedNotification(
        $renewal,
        $borrow,
        'Maria Santos',
    );

    expect($notification->toArray(new User))->toMatchArray([
        'type' => 'renewal_approved',
        'title' => 'Extension Request Approved',
        'message' => "Your extension request for Logitech Mouse has been approved. New return date: September 01, 2026.\n\nProcessed by custodian: Maria Santos",
        'borrow_request_id' => 12,
        'borrow_renewal_id' => 24,
        'asset_name' => 'Logitech Mouse',
        'asset_tag' => 'AST-00007',
        'due_date' => '2026-09-01',
        'processed_by' => 'Maria Santos',
    ]);
});
