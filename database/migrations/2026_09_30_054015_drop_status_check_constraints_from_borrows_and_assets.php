<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::connection()->getDriverName() !== 'pgsql') {
            return;
        }

        DB::statement('ALTER TABLE borrows DROP CONSTRAINT IF EXISTS borrows_status_check');
        DB::statement('ALTER TABLE assets DROP CONSTRAINT IF EXISTS assets_status_check');
    }

    public function down(): void
    {
        if (DB::connection()->getDriverName() !== 'pgsql') {
            return;
        }

        DB::statement("ALTER TABLE borrows ADD CONSTRAINT borrows_status_check CHECK (status IN ('pending','borrowed','awaiting_check','returned','rejected','consumed'))");
        DB::statement("ALTER TABLE assets ADD CONSTRAINT assets_status_check CHECK (status IN ('available','borrowed','under_repair','disposed','lost','unavailable'))");
    }
};