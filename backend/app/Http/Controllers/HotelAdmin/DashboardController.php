<?php

namespace App\Http\Controllers\HotelAdmin;

use App\Http\Controllers\Controller;
use App\Models\Tenant\Booking;
use App\Models\Tenant\Customer;
use App\Models\Tenant\Hotel;
use App\Models\Tenant\Room;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function summary(Request $request)
    {
        $today = now()->startOfDay();
        $monthStart = now()->startOfMonth();

        $totalRooms = Room::count();
        $occupied = Room::where('status', Room::STATUS_OCCUPIED)->count();

        $arrivalsToday = Booking::whereDate('check_in_date', $today)
            ->whereIn('status', [Booking::STATUS_CONFIRMED, Booking::STATUS_CHECKED_IN])
            ->count();
        $departuresToday = Booking::whereDate('check_out_date', $today)
            ->whereIn('status', [Booking::STATUS_CHECKED_IN, Booking::STATUS_CHECKED_OUT])
            ->count();

        $revenueMonth = (float) Booking::where('created_at', '>=', $monthStart)
            ->whereIn('status', [Booking::STATUS_CONFIRMED, Booking::STATUS_CHECKED_IN, Booking::STATUS_CHECKED_OUT])
            ->sum('grand_total');

        return response()->json([
            'hotels' => Hotel::count(),
            'rooms_total' => $totalRooms,
            'rooms_occupied' => $occupied,
            'occupancy_rate' => $totalRooms > 0 ? round(($occupied / $totalRooms) * 100, 1) : 0.0,
            'arrivals_today' => $arrivalsToday,
            'departures_today' => $departuresToday,
            'revenue_this_month' => $revenueMonth,
            'customers_total' => Customer::count(),
            'recent_bookings' => Booking::with('customer:id,first_name,last_name', 'roomClass:id,name')
                ->latest()->limit(5)->get(),
        ]);
    }
}
