<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('categories', function (Blueprint $table) {
            $table->string('unit_type', 20)->default('single')->after('prefix');
        });

        \Illuminate\Support\Facades\DB::table('categories')
            ->where('name', 'Office Supplies')
            ->update(['unit_type' => 'multi']);
    }

    public function down(): void
    {
        Schema::table('categories', function (Blueprint $table) {
            $table->dropColumn('unit_type');
        });
    }
};
