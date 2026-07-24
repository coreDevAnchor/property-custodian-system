<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('borrows', function (Blueprint $table) {
            $table->dropColumn('return_condition');
        });

        Schema::table('borrows', function (Blueprint $table) {
            $table->enum('return_condition', [
                'ok',
                'defective',
                'lost',
            ])->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('borrows', function (Blueprint $table) {
            $table->dropColumn('return_condition');
        });

        Schema::table('borrows', function (Blueprint $table) {
            $table->enum('return_condition', [
                'ok',
                'defective',
            ])->nullable();
        });
    }
};