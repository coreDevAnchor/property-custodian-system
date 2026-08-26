<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\Storage;
use Laravel\Fortify\Contracts\PasskeyUser;
use Laravel\Fortify\PasskeyAuthenticatable;
use Laravel\Fortify\TwoFactorAuthenticatable;

#[Fillable([
    'name',
    'email',
    'password',
    'role',
    'profile_photo_path',
    'must_change_password',
])]

#[Hidden(['password', 'two_factor_secret', 'two_factor_recovery_codes', 'remember_token'])]

/**
 * @property int $id
 * @property string $name
 * @property string $email
 * @property string $role
 * @property string|null $profile_photo_path
 * @property-read string|null $avatar
 * @property-read Employee|null $employee
 */
class User extends Authenticatable implements MustVerifyEmail, PasskeyUser
{
    use HasFactory, Notifiable, PasskeyAuthenticatable, TwoFactorAuthenticatable;

    /**
     * Accessors to append to the model's array and JSON forms.
     *
     * @var array<int, string>
     */
    protected $appends = ['avatar'];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'two_factor_confirmed_at' => 'datetime',
            'must_change_password' => 'boolean',
        ];
    }

    /**
     * The URL of the user's profile photo, or null when unset.
     */
    protected function avatar(): Attribute
    {
        return Attribute::get(
            fn () => $this->profile_photo_path
                ? Storage::url($this->profile_photo_path)
                : null,
        );
    }

    public function employee(): HasOne
    {
        return $this->hasOne(Employee::class);
    }

    public function approvedBorrows(): HasMany
    {
        return $this->hasMany(BorrowRequest::class, 'approved_by');
    }

    public function borrows(): HasMany
    {
        return $this->hasMany(BorrowRequest::class, 'borrower_id');
    }

    public function checkedBorrows(): HasMany
    {
        return $this->hasMany(BorrowRequest::class, 'checked_by');
    }
}
