<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('borrows', function (Blueprint $table) {
            $table->enum('return_condition', ['ok', 'defective', 'lost'])
                ->nullable()
                ->change();
        });
    }

    public function down(): void
    {
        DB::table('borrows')->where('return_condition', 'lost')->update(['return_condition' => 'defective']);

        Schema::table('borrows', function (Blueprint $table) {
            $table->enum('return_condition', ['ok', 'defective'])
                ->nullable()
                ->change();
        });
    }
};