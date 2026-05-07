<?php

namespace App\Http\Controllers\HotelAdmin;

use App\Http\Controllers\Controller;
use App\Models\Tenant\Booking;
use App\Models\Tenant\BookingPayment;
use App\Models\Tenant\Customer;
use App\Models\Tenant\Hotel;
use App\Models\Tenant\Room;
use App\Models\Tenant\RoomClass;
use App\Services\BookingPricingService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class BookingController extends Controller
{
    public function __construct(protected BookingPricingService $pricing) {}

    public function index(Request $request)
    {
        $query = Booking::query()->with('customer:id,first_name,last_name,email,phone', 'roomClass:id,name', 'room:id,room_number');

        if ($hotelId = $request->query('hotel_id')) {
            $query->where('hotel_id', $hotelId);
        }
        if ($status = $request->query('status')) {
            $query->where('status', strtoupper($status));
        }
        if ($from = $request->query('from')) {
            $query->whereDate('check_in_date', '>=', $from);
        }
        if ($to = $request->query('to')) {
            $query->whereDate('check_out_date', '<=', $to);
        }
        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('reference', 'like', "%{$search}%")
                    ->orWhereHas('customer', function ($qq) use ($search) {
                        $qq->where('first_name', 'like', "%{$search}%")
                            ->orWhere('last_name', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%")
                            ->orWhere('phone', 'like', "%{$search}%");
                    });
            });
        }

        return $query->latest()->paginate($request->integer('per_page', 25));
    }

    public function show(Booking $booking)
    {
        return $booking->load('customer', 'roomClass', 'room', 'addons', 'payments');
    }

    public function calendar(Request $request)
    {
        $data = $request->validate([
            'hotel_id' => ['required', 'integer', 'exists:hotels,id'],
            'from' => ['required', 'date'],
            'to' => ['required', 'date', 'after_or_equal:from'],
        ]);

        return Booking::query()
            ->where('hotel_id', $data['hotel_id'])
            ->whereDate('check_in_date', '<=', $data['to'])
            ->whereDate('check_out_date', '>=', $data['from'])
            ->whereNotIn('status', [Booking::STATUS_CANCELLED, Booking::STATUS_NO_SHOW])
            ->with('customer:id,first_name,last_name', 'roomClass:id,name', 'room:id,room_number')
            ->get();
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'hotel_id' => ['required', 'integer', 'exists:hotels,id'],
            'customer_id' => ['nullable', 'integer', 'exists:customers,id'],
            'room_class_id' => ['required', 'integer', 'exists:room_classes,id'],
            'room_id' => ['nullable', 'integer', 'exists:rooms,id'],
            'check_in_date' => ['required', 'date'],
            'check_out_date' => ['required', 'date', 'after:check_in_date'],
            'adults' => ['required', 'integer', 'min:1', 'max:30'],
            'children' => ['required', 'integer', 'min:0', 'max:30'],
            'special_requests' => ['nullable', 'string', 'max:2000'],
            'internal_notes' => ['nullable', 'string', 'max:2000'],
            'source' => ['nullable', 'in:DIRECT,BOOKING_ENGINE,WALK_IN,PHONE,OTA'],
            'addons' => ['nullable', 'array'],
            'guest' => ['nullable', 'array'],
            'guest.first_name' => ['nullable', 'string', 'max:80'],
            'guest.last_name' => ['nullable', 'string', 'max:80'],
            'guest.email' => ['nullable', 'email'],
            'guest.phone' => ['nullable', 'string', 'max:32'],
        ]);

        return DB::transaction(function () use ($data) {
            $hotel = Hotel::findOrFail($data['hotel_id']);
            $roomClass = RoomClass::findOrFail($data['room_class_id']);

            $customer = isset($data['customer_id'])
                ? Customer::findOrFail($data['customer_id'])
                : Customer::create(array_merge(
                    ['hotel_id' => $hotel->id],
                    $data['guest'] ?? ['first_name' => 'Walk-in Guest'],
                ));

            $quote = $this->pricing->quote(
                $hotel,
                $roomClass,
                $data['check_in_date'],
                $data['check_out_date'],
                (int) $data['adults'],
                (int) $data['children'],
                $data['addons'] ?? [],
            );

            $booking = Booking::create([
                'reference' => 'BK-'.strtoupper(Str::random(8)),
                'hotel_id' => $hotel->id,
                'customer_id' => $customer->id,
                'room_class_id' => $roomClass->id,
                'room_id' => $data['room_id'] ?? null,
                'source' => $data['source'] ?? 'DIRECT',
                'status' => Booking::STATUS_CONFIRMED,
                'payment_status' => 'UNPAID',
                'check_in_date' => $data['check_in_date'],
                'check_out_date' => $data['check_out_date'],
                'adults' => $data['adults'],
                'children' => $data['children'],
                'nights' => $quote['nights'],
                'room_subtotal' => $quote['room_subtotal'],
                'addons_subtotal' => $quote['addons_subtotal'],
                'tax_total' => $quote['tax_total'],
                'grand_total' => $quote['grand_total'],
                'amount_due' => $quote['grand_total'],
                'currency' => $quote['currency'],
                'special_requests' => $data['special_requests'] ?? null,
                'internal_notes' => $data['internal_notes'] ?? null,
                'guest_snapshot' => $customer->only(['first_name', 'last_name', 'email', 'phone']),
                'pricing_snapshot' => $quote,
            ]);

            foreach ($quote['addons'] as $addon) {
                $booking->addons()->create($addon);
            }

            return $booking->load('customer', 'roomClass', 'room', 'addons');
        });
    }

    public function update(Request $request, Booking $booking)
    {
        $data = $request->validate([
            'room_id' => ['nullable', 'integer', 'exists:rooms,id'],
            'special_requests' => ['nullable', 'string', 'max:2000'],
            'internal_notes' => ['nullable', 'string', 'max:2000'],
            'status' => ['nullable', 'in:PENDING,CONFIRMED,CHECKED_IN,CHECKED_OUT,CANCELLED,NO_SHOW'],
        ]);

        $booking->update($data);

        return $booking->fresh();
    }

    public function checkIn(Booking $booking)
    {
        $booking->update([
            'status' => Booking::STATUS_CHECKED_IN,
            'checked_in_at' => now(),
        ]);
        if ($booking->room_id) {
            Room::where('id', $booking->room_id)->update(['status' => Room::STATUS_OCCUPIED]);
        }

        return $booking->fresh();
    }

    public function checkOut(Booking $booking)
    {
        $booking->update([
            'status' => Booking::STATUS_CHECKED_OUT,
            'checked_out_at' => now(),
        ]);
        if ($booking->room_id) {
            Room::where('id', $booking->room_id)->update([
                'status' => Room::STATUS_CLEANING,
                'housekeeping_status' => 'DIRTY',
            ]);
        }

        return $booking->fresh();
    }

    public function cancel(Request $request, Booking $booking)
    {
        $data = $request->validate(['reason' => ['nullable', 'string', 'max:500']]);
        $booking->update([
            'status' => Booking::STATUS_CANCELLED,
            'internal_notes' => trim(($booking->internal_notes ?? '')."\nCancelled: ".($data['reason'] ?? '')),
        ]);

        return $booking->fresh();
    }

    public function recordPayment(Request $request, Booking $booking)
    {
        $data = $request->validate([
            'method' => ['required', 'in:CASH,CARD,BANK_TRANSFER,UPI,ONLINE,OTHER'],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'reference' => ['nullable', 'string', 'max:80'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        return DB::transaction(function () use ($booking, $data) {
            BookingPayment::create([
                'booking_id' => $booking->id,
                'method' => $data['method'],
                'amount' => $data['amount'],
                'reference' => $data['reference'] ?? null,
                'notes' => $data['notes'] ?? null,
                'paid_at' => now(),
            ]);

            $totalPaid = (float) $booking->payments()->sum('amount');
            $booking->update([
                'amount_paid' => $totalPaid,
                'amount_due' => max(0, (float) $booking->grand_total - $totalPaid),
                'payment_status' => $totalPaid >= (float) $booking->grand_total ? 'PAID' : ($totalPaid > 0 ? 'PARTIAL' : 'UNPAID'),
            ]);

            return $booking->fresh()->load('payments');
        });
    }
}
