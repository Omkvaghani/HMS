<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('hotels', function (Blueprint $table) {
            // Free-form per-hotel settings. Recognized keys are documented in
            // HotelSettingsController::DEFAULTS — e.g.
            //   default_next_day_checkout_time: "11:00"
            //   enabled_duration_types: ["1H","2H","3H","12H","NIGHT","DAY"]
            //   auto_confirm_online: true
            //   theme: "warm"
            $table->json('settings')->nullable()->after('tax_mode');
        });
    }

    public function down(): void
    {
        Schema::table('hotels', function (Blueprint $table) {
            $table->dropColumn('settings');
        });
    }
};
