<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('movements', function (Blueprint $table) {
            $table->id();

            $table->foreignId('asset_id')
                ->constrained()
                ->restrictOnDelete();

            $table->foreignId('actor_id')
                ->constrained('users')
                ->restrictOnDelete();

            $table->enum('action', [
                'created',
                'updated',
                'borrow_requested',
                'borrow_approved',
                'borrow_rejected',
                'returned',
                'returned_checked',
                'under_repair',
                'disposed',
            ]);

            $table->text('note')->nullable();

            $table->timestamp('created_at')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('movements');
    }
};