<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('room_classes', function (Blueprint $table) {
            // Per-duration pricing map. Keys are duration codes (see
            // BookingPricingService::DURATIONS), values are decimal strings.
            // Example: {"1H": "499.00", "12H": "1499.00", "NIGHT": "2499.00"}
            $table->json('duration_prices')->nullable()->after('weekend_price');
        });
    }

    public function down(): void
    {
        Schema::table('room_classes', function (Blueprint $table) {
            $table->dropColumn('duration_prices');
        });
    }
};
