<?php

namespace App\Observers;

use App\Models\Employee;
use App\Models\User;

class UserObserver
{
    public function deleting(User $user): void
    {
        $user->employee()->delete();
    }

    public function created(User $user): void
    {
        if ($user->role !== 'employee') {
            return;
        }

        if ($user->employee()->exists()) {
            return;
        }

        $user->employee()->create([
            'department' => 'Unassigned',
            'employee_id' => $this->nextEmployeeId(),
            'is_active' => true,
        ]);
    }

    private function nextEmployeeId(): string
    {
        $last = Employee::latest('id')->value('employee_id');

        $num = $last
            ? ((int) str_replace('EMP-', '', $last)) + 1
            : 1;

        return 'EMP-' . str_pad($num, 4, '0', STR_PAD_LEFT);
    }
}
