<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            // Duration model — short stays (1H/2H/3H/12H), full nights, or
            // multi-day stays. Existing data stays as DAY (multi-night).
            $table->string('duration_type', 16)->default('DAY')->after('children')->index();
            $table->unsignedSmallInteger('duration_hours')->nullable()->after('duration_type');

            // Booking channel — distinct from `source`. ONLINE = paid via
            // booking engine / gateway, OFFLINE = walk-in / phone, ADVANCE =
            // future-dated reservation taken in advance.
            $table->string('booking_type', 16)->default('OFFLINE')->after('source')->index();

            // For ADVANCE bookings the desk-clerk records the actual date the
            // guest will arrive. NULL for normal bookings.
            $table->date('booked_for_date')->nullable()->after('check_out_date');

            // Exact stay window (when duration_type != DAY). NULL for
            // night-based bookings (we still rely on check_in_date / nights).
            $table->dateTime('stay_starts_at')->nullable()->after('checked_out_at');
            $table->dateTime('stay_ends_at')->nullable()->after('stay_starts_at');
        });
    }

    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->dropColumn([
                'duration_type', 'duration_hours', 'booking_type',
                'booked_for_date', 'stay_starts_at', 'stay_ends_at',
            ]);
        });
    }
};
