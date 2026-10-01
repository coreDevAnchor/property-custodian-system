<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // The low-stock alert fires on an absolute threshold (5 units), so no
        // original-amount snapshot is needed. Databases that never received the
        // column (migrations that ran before it was added) are left untouched.
        if (! Schema::hasColumn('assets', 'original_amount')) {
            return;
        }

        Schema::table('assets', function (Blueprint $table) {
            $table->dropColumn('original_amount');
        });
    }

    public function down(): void
    {
        if (Schema::hasColumn('assets', 'original_amount')) {
            return;
        }

        Schema::table('assets', function (Blueprint $table) {
            $table->unsignedInteger('original_amount')
                ->nullable()
                ->after('low_stock_notified_at');
        });
    }
};
