<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BorrowRenewal extends Model
{
    protected $fillable = [
        'borrow_id',
        'requested_due_date',
        'reason',
        'status',
        'approved_by',
        'approved_at',
        'remarks',
    ];

    protected $casts = [
        'requested_due_date' => 'date',
        'approved_at' => 'datetime',
    ];

    public function borrow()
    {
        return $this->belongsTo(BorrowRequest::class, 'borrow_id');
    }

    public function approver()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }


}