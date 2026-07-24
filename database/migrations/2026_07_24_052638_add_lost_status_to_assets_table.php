<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('assets', function (Blueprint $table) {
            $table->enum('status', ['available', 'borrowed', 'under_repair', 'disposed', 'lost'])
                ->default('available')
                ->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::table('assets')->where('status', 'lost')->update(['status' => 'disposed']);

        Schema::table('assets', function (Blueprint $table) {
            $table->enum('status', ['available', 'borrowed', 'under_repair', 'disposed'])
                ->default('available')
                ->change();
        });
    }
};
