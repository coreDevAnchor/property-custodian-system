<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('borrows', function (Blueprint $table) {
            $table->timestamp('receipt_printed_at')->nullable()->after('is_acknowledged');
            $table->foreignId('receipt_printed_by')->nullable()->after('receipt_printed_at')->constrained('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('borrows', function (Blueprint $table) {
            $table->dropConstrainedForeignId('receipt_printed_by');
            $table->dropColumn('receipt_printed_at');
        });
    }
};