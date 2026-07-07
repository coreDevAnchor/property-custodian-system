<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('assets', function (Blueprint $table) {
            $table->id();

            $table->string('asset_tag')->unique();
            $table->string('name');
            $table->text('description')->nullable();

            $table->foreignId('category_id')
                ->constrained()
                ->restrictOnDelete();

            $table->string('serial_number')->nullable()->unique();

            $table->date('acquisition_date');
            $table->decimal('acquisition_cost', 12, 2);

            $table->decimal('depreciation_rate', 5, 2)->default(0.00);

            $table->unsignedTinyInteger('condition');

            $table->enum('status', [
                'available',
                'borrowed',
                'under_repair',
                'disposed',
            ])->default('available');

            $table->string('photo')->nullable();
            $table->string('location')->nullable();

            $table->text('remarks')->nullable();

            $table->timestamps();
        });
    }


    public function down(): void
    {
        Schema::dropIfExists('assets');
    }
};
