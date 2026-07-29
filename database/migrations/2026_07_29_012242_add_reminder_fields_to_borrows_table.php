<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('borrows', function (Blueprint $table) {
            $table->boolean('three_day_reminder_sent')->default(false);
            $table->timestamp('three_day_reminder_sent_at')->nullable();

            $table->boolean('deadline_reminder_sent')->default(false);
            $table->timestamp('deadline_reminder_sent_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('borrows', function (Blueprint $table) {
            $table->dropColumn([
                'three_day_reminder_sent',
                'three_day_reminder_sent_at',
                'deadline_reminder_sent',
                'deadline_reminder_sent_at',
            ]);
        });
    }
};
