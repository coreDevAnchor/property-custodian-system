<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('borrows', function (Blueprint $table) {
            $table->foreignId('employee_id')->nullable()->change();
            $table->foreignId('borrower_id')->nullable()->after('employee_id')->constrained('users')->restrictOnDelete();
        });

        DB::statement(
            'UPDATE borrows SET borrower_id = employees.user_id FROM employees WHERE employees.id = borrows.employee_id'
        );
    }

    public function down(): void
    {
        Schema::table('borrows', function (Blueprint $table) {
            $table->dropConstrainedForeignId('borrower_id');
        });
    }
};
