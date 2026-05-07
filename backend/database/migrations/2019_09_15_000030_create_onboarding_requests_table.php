<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('onboarding_requests', function (Blueprint $table) {
            $table->id();
            $table->string('hotel_name');
            $table->string('legal_name')->nullable();
            $table->string('contact_name');
            $table->string('contact_email')->index();
            $table->string('contact_phone')->nullable();
            $table->string('country', 2)->nullable();
            $table->string('city')->nullable();
            $table->string('desired_subdomain')->index();
            $table->foreignId('package_id')->nullable()->constrained('packages')->nullOnDelete();
            $table->text('message')->nullable();
            $table->enum('status', ['PENDING', 'APPROVED', 'REJECTED'])->default('PENDING')->index();
            $table->string('rejection_reason')->nullable();
            $table->string('tenant_id')->nullable()->index(); // populated after approval
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('onboarding_requests');
    }
};
