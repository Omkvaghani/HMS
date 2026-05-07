<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('customers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('hotel_id')->constrained('hotels')->cascadeOnDelete();
            $table->string('first_name');
            $table->string('last_name')->nullable();
            $table->string('email')->nullable()->index();
            $table->string('phone')->nullable()->index();
            $table->date('date_of_birth')->nullable();
            $table->enum('gender', ['MALE', 'FEMALE', 'OTHER', 'UNDISCLOSED'])->default('UNDISCLOSED');
            $table->string('nationality', 2)->nullable();
            $table->string('address_line1')->nullable();
            $table->string('city')->nullable();
            $table->string('state')->nullable();
            $table->string('country', 2)->nullable();
            $table->string('postal_code')->nullable();
            $table->string('id_type')->nullable(); // PASSPORT, DRIVING_LICENSE, NATIONAL_ID
            $table->string('id_number')->nullable();
            $table->string('id_front_url')->nullable();
            $table->string('id_back_url')->nullable();
            $table->string('signature_url')->nullable();
            $table->json('preferences')->nullable();
            $table->text('notes')->nullable();
            $table->unsignedInteger('total_stays')->default(0);
            $table->decimal('lifetime_value', 12, 2)->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('customers');
    }
};
