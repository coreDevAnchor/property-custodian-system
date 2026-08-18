<?php

use App\Models\Asset;
use App\Models\BorrowRequest;
use App\Models\User;
use App\Notifications\BorrowRequestStatusNotification;

test('borrow status notifications identify the custodian who processed the request', function () {
    $borrowRequest = new BorrowRequest([
        'asset_id' => 1,
        'status' => 'borrowed',
    ]);
    $borrowRequest->setRelation('asset', new Asset(['name' => 'Logitech Mouse']));

    $notification = new BorrowRequestStatusNotification(
        $borrowRequest,
        processedBy: 'Maria Santos',
    );

    expect($notification->toArray(new User()))->toMatchArray([
        'message' => "Your request to borrow Logitech Mouse has been approved.\n\nProcessed by custodian: Maria Santos",
        'processed_by' => 'Maria Santos',
    ]);
});

test('rejected borrow status notifications identify the custodian and include the reason', function () {
    $borrowRequest = new BorrowRequest([
        'asset_id' => 1,
        'status' => 'rejected',
    ]);
    $borrowRequest->setRelation('asset', new Asset(['name' => 'Epson Printer']));

    $notification = new BorrowRequestStatusNotification(
        $borrowRequest,
        'The asset is already borrowed.',
        'Maria Santos',
    );

    expect($notification->toArray(new User()))->toMatchArray([
        'message' => "Your request to borrow Epson Printer has been rejected.\n\nProcessed by custodian: Maria Santos\n\nReason provided by the custodian:\nThe asset is already borrowed.",
        'processed_by' => 'Maria Santos',
    ]);
});
