<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tenants', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('name');
            $table->string('legal_name')->nullable();
            $table->string('contact_email')->index();
            $table->string('contact_phone')->nullable();
            $table->string('country', 2)->nullable();
            $table->string('city')->nullable();
            $table->string('timezone')->default('UTC');
            $table->string('currency', 3)->default('USD');
            $table->enum('status', ['PENDING', 'ACTIVE', 'SUSPENDED', 'REJECTED'])->default('PENDING')->index();
            $table->foreignId('package_id')->nullable()->constrained('packages')->nullOnDelete();
            $table->timestamp('trial_ends_at')->nullable();
            $table->timestamp('subscription_ends_at')->nullable();
            $table->timestamps();
            $table->json('data')->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tenants');
    }
};
