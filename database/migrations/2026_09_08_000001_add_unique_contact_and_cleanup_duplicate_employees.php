<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        DB::transaction(function () {
            // Remove double-created junk employee rows (UserObserver leftovers
            // from EmployeeController::store) while keeping one record per user.
            $rows = DB::table('employees')
                ->where('department', 'Unassigned')
                ->orderBy('id')
                ->get();

            foreach ($rows as $row) {
                $keeperId = DB::table('employees')
                    ->where('user_id', $row->user_id)
                    ->where('id', '!=', $row->id)
                    ->orderBy('id')
                    ->value('id');

                if ($keeperId === null) {
                    continue;
                }

                DB::table('borrows')
                    ->where('employee_id', $row->id)
                    ->update(['employee_id' => $keeperId]);

                DB::table('employees')
                    ->where('id', $row->id)
                    ->delete();
            }

            // Deduplicate identical contact numbers, keeping the earliest record.
            DB::statement('
                UPDATE employees
                SET contact = NULL
                WHERE id IN (
                    SELECT id FROM (
                        SELECT id,
                               ROW_NUMBER() OVER (PARTITION BY contact ORDER BY id) AS rn
                        FROM employees
                        WHERE contact IS NOT NULL
                    ) ranked
                    WHERE rn > 1
                )
            ');
        });

        Schema::table('employees', function (Blueprint $table) {
            $table->unique('contact');
        });
    }

    public function down(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            $table->dropUnique(['contact']);
        });
    }
};