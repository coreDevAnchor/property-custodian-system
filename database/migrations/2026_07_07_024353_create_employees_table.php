<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
        {
            Schema::create('employees', function (Blueprint $table) {
                $table->id();

                $table->foreignId('user_id')
                    ->constrained()
                    ->restrictOnDelete();

                $table->string('department');
                $table->string('employee_id')->nullable()->unique();
                $table->string('contact')->nullable();
                $table->boolean('is_active')->default(true);

                $table->timestamps();
            });
        }

    public function down(): void
        {
            Schema::dropIfExists('employees');
        }
};
