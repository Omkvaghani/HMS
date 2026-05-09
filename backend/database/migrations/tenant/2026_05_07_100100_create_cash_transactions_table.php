<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cash_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('hotel_id')->constrained('hotels')->cascadeOnDelete();
            $table->date('transaction_date')->index();
            $table->enum('direction', ['IN', 'OUT'])->index();
            $table->enum('kind', [
                'OPENING_BALANCE', 'BOOKING_PAYMENT', 'EXPENSE',
                'STAFF_ADVANCE', 'BANK_DEPOSIT', 'PETTY_CASH', 'CLOSING_BALANCE', 'OTHER',
            ])->default('OTHER')->index();
            $table->decimal('amount', 12, 2);
            $table->string('currency', 3)->default('USD');
            $table->string('reference')->nullable();
            $table->text('notes')->nullable();
            $table->unsignedBigInteger('booking_id')->nullable()->index();
            $table->unsignedBigInteger('expense_id')->nullable()->index();
            $table->unsignedBigInteger('recorded_by')->nullable()->index();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cash_transactions');
    }
};
