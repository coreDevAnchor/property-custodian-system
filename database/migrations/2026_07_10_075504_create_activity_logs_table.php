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
        Schema::create('activity_logs', function (Blueprint $table) {
            $table->id();

            // Every logged event is tied to the asset it happened to —
            // borrow/return/approval/rejection/repair/disposal all live
            // on the asset's timeline.
            $table->foreignId('asset_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->string('action'); // e.g. 'borrow_requested', 'asset_disposed'
            $table->text('description');

            $table->foreignId('actor_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->json('metadata')->nullable();

            $table->timestamp('created_at')->useCurrent();

            $table->index(['asset_id', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('activity_logs');
    }
};
