<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Factories\HasFactory;

/**
 * @property int $id
 * @property int $asset_id
 * @property int $employee_id
 * @property int $borrower_id
 * @property 'pending'|'borrowed'|'awaiting_check'|'returned'|'rejected' $status
 * @property string|null $remarks
 * @property 'ok'|'defective'|'lost'|null $return_condition
 * @property-read Asset $asset
 * @property-read Employee $employee
 *
 * @method static BorrowRequest|null find(int|string $id, array<int, string> $columns = ['*'])
 * @method static BorrowRequest findOrFail(int|string $id, array<int, string> $columns = ['*'])
 */
class BorrowRequest extends Model
{
    use HasFactory;
    protected $table = 'borrows';

    protected $casts = [
        'requested_at' => 'datetime',
        'approved_at' => 'datetime',
        'returned_at' => 'datetime',
        'is_acknowledged' => 'boolean',
        'expected_return_date' => 'date',
    ];

    protected $fillable = [
        'asset_id',
        'employee_id',
        'borrower_id',
        'approved_by',
        'checked_by',
        'status',
        'requested_at',
        'approved_at',
        'returned_at',
        'return_condition',
        'is_acknowledged',
        'remarks',
        'expected_return_date',
    ];

    public function asset(): BelongsTo
    {
        return $this->belongsTo(Asset::class);
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    public function borrower(): BelongsTo
    {
        return $this->belongsTo(User::class, 'borrower_id');
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function checkedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'checked_by');
    }

    public function returnRecord(): HasOne
    {
        return $this->hasOne(ReturnRecord::class);
    }

    public function renewals()
    {
        return $this->hasMany(BorrowRenewal::class, 'borrow_id');
    }

    public function isPending(): bool
    {
        return $this->status === 'pending';
    }

    public function isBorrowed(): bool
    {
        return $this->status === 'borrowed';
    }

    public function isReturned(): bool
    {
        return $this->status === 'returned';
    }

    public function isRejected(): bool
    {
        return $this->status === 'rejected';
    }
}
