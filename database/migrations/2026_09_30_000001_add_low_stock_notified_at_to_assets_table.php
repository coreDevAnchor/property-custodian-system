<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('assets', function (Blueprint $table) {
            $table->timestamp('low_stock_notified_at')
                ->nullable()
                ->after('amount');

            $table->unsignedInteger('original_amount')
                ->nullable()
                ->after('low_stock_notified_at');
        });

        DB::table('assets')
            ->whereNull('original_amount')
            ->update(['original_amount' => DB::raw('amount')]);
    }

    public function down(): void
    {
        Schema::table('assets', function (Blueprint $table) {
            $table->dropColumn('low_stock_notified_at');
            $table->dropColumn('original_amount');
        });
    }
};
