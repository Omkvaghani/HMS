<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\Tenant\Booking;
use App\Models\Tenant\BookingEngineConfig;
use App\Models\Tenant\Customer;
use App\Models\Tenant\Hotel;
use App\Models\Tenant\PublicAddon;
use App\Models\Tenant\Room;
use App\Models\Tenant\RoomClass;
use App\Services\BookingPricingService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class BookingEngineController extends Controller
{
    public function __construct(protected BookingPricingService $pricing) {}

    /** GET /api/public/{subdomain}/branding — public, no auth. */
    public function branding(Request $request)
    {
        $hotel = Hotel::query()->orderBy('id')->firstOrFail();
        $config = BookingEngineConfig::firstOrCreate(['hotel_id' => $hotel->id], []);
        $addons = PublicAddon::where('hotel_id', $hotel->id)->where('is_active', true)
            ->orderBy('sort_order')->get();

        return response()->json([
            'hotel' => $hotel->only([
                'id', 'name', 'slug', 'description', 'city', 'country',
                'address_line1', 'phone', 'email', 'website',
                'logo_url', 'cover_image_url', 'amenities', 'policies',
                'check_in_time', 'check_out_time', 'currency', 'timezone',
            ]),
            'config' => $config,
            'addons' => $addons,
        ]);
    }

    /** GET /api/public/{subdomain}/availability?from=...&to=...&adults=...&children=... */
    public function availability(Request $request)
    {
        $data = $request->validate([
            'from' => ['required', 'date', 'after_or_equal:today'],
            'to' => ['required', 'date', 'after:from'],
            'adults' => ['required', 'integer', 'min:1', 'max:30'],
            'children' => ['nullable', 'integer', 'min:0', 'max:30'],
        ]);

        $hotel = Hotel::orderBy('id')->firstOrFail();
        $children = (int) ($data['children'] ?? 0);

        $classes = RoomClass::where('hotel_id', $hotel->id)
            ->where('is_active', true)
            ->where('max_occupancy', '>=', $data['adults'] + $children)
            ->orderBy('sort_order')
            ->get();

        $bookedRoomIdsByClass = Booking::where('hotel_id', $hotel->id)
            ->whereIn('status', [Booking::STATUS_CONFIRMED, Booking::STATUS_CHECKED_IN])
            ->whereDate('check_in_date', '<', $data['to'])
            ->whereDate('check_out_date', '>', $data['from'])
            ->select('room_class_id', DB::raw('COUNT(*) as cnt'))
            ->groupBy('room_class_id')
            ->pluck('cnt', 'room_class_id');

        $rooms = Room::where('hotel_id', $hotel->id)
            ->where('is_active', true)
            ->where('status', '!=', Room::STATUS_OUT_OF_ORDER)
            ->select('room_class_id', DB::raw('COUNT(*) as cnt'))
            ->groupBy('room_class_id')
            ->pluck('cnt', 'room_class_id');

        $results = $classes->map(function (RoomClass $rc) use ($hotel, $data, $children, $rooms, $bookedRoomIdsByClass) {
            $available = max(0, ($rooms[$rc->id] ?? 0) - ($bookedRoomIdsByClass[$rc->id] ?? 0));
            try {
                $quote = $this->pricing->quote($hotel, $rc, $data['from'], $data['to'], (int) $data['adults'], $children);
            } catch (\Throwable) {
                $quote = null;
            }

            return [
                'room_class' => $rc->only([
                    'id', 'name', 'slug', 'description',
                    'max_adults', 'max_children', 'max_occupancy',
                    'bed_count', 'bed_type',
                    'amenities', 'image_urls', 'size_sqft',
                    'base_price',
                ]),
                'available_count' => $available,
                'quote' => $quote,
            ];
        });

        return response()->json([
            'currency' => $hotel->currency,
            'results' => $results,
        ]);
    }

    /** POST /api/public/{subdomain}/quote — itemised pricing for a specific class + addons. */
    public function quote(Request $request)
    {
        $data = $request->validate([
            'room_class_id' => ['required', 'integer'],
            'check_in_date' => ['required', 'date', 'after_or_equal:today'],
            'check_out_date' => ['required', 'date', 'after:check_in_date'],
            'adults' => ['required', 'integer', 'min:1', 'max:30'],
            'children' => ['required', 'integer', 'min:0', 'max:30'],
            'addons' => ['nullable', 'array'],
            'addons.*.public_addon_id' => ['required_with:addons', 'integer'],
            'addons.*.quantity' => ['required_with:addons', 'integer', 'min:1', 'max:50'],
        ]);

        $hotel = Hotel::orderBy('id')->firstOrFail();
        $rc = RoomClass::where('hotel_id', $hotel->id)->findOrFail($data['room_class_id']);

        return response()->json($this->pricing->quote(
            $hotel,
            $rc,
            $data['check_in_date'],
            $data['check_out_date'],
            (int) $data['adults'],
            (int) $data['children'],
            $data['addons'] ?? [],
        ));
    }

    /** POST /api/public/{subdomain}/book */
    public function book(Request $request)
    {
        $data = $request->validate([
            'room_class_id' => ['required', 'integer'],
            'check_in_date' => ['required', 'date', 'after_or_equal:today'],
            'check_out_date' => ['required', 'date', 'after:check_in_date'],
            'adults' => ['required', 'integer', 'min:1', 'max:30'],
            'children' => ['required', 'integer', 'min:0', 'max:30'],
            'guest.first_name' => ['required', 'string', 'max:80'],
            'guest.last_name' => ['nullable', 'string', 'max:80'],
            'guest.email' => ['required', 'email', 'max:160'],
            'guest.phone' => ['required', 'string', 'max:32'],
            'guest.country' => ['nullable', 'string', 'size:2'],
            'special_requests' => ['nullable', 'string', 'max:2000'],
            'addons' => ['nullable', 'array'],
            'addons.*.public_addon_id' => ['required_with:addons', 'integer'],
            'addons.*.quantity' => ['required_with:addons', 'integer', 'min:1', 'max:50'],
        ]);

        return DB::transaction(function () use ($data) {
            $hotel = Hotel::orderBy('id')->firstOrFail();
            $rc = RoomClass::where('hotel_id', $hotel->id)->findOrFail($data['room_class_id']);

            $customer = Customer::firstOrCreate(
                ['hotel_id' => $hotel->id, 'email' => $data['guest']['email']],
                array_merge(['hotel_id' => $hotel->id], $data['guest']),
            );

            $quote = $this->pricing->quote(
                $hotel,
                $rc,
                $data['check_in_date'],
                $data['check_out_date'],
                (int) $data['adults'],
                (int) $data['children'],
                $data['addons'] ?? [],
            );

            $booking = Booking::create([
                'reference' => 'BE-'.strtoupper(Str::random(8)),
                'hotel_id' => $hotel->id,
                'customer_id' => $customer->id,
                'room_class_id' => $rc->id,
                'source' => 'BOOKING_ENGINE',
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
                'guest_snapshot' => $data['guest'],
                'pricing_snapshot' => $quote,
            ]);

            foreach ($quote['addons'] as $addon) {
                $booking->addons()->create($addon);
            }

            return response()->json([
                'booking' => $booking->load('addons'),
                'message' => 'Booking confirmed. A confirmation has been sent to '.$data['guest']['email'].'.',
            ], 201);
        });
    }
}
