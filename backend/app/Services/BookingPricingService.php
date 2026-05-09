<?php

namespace App\Services;

use App\Models\Tenant\Hotel;
use App\Models\Tenant\PublicAddon;
use App\Models\Tenant\RoomClass;
use Carbon\CarbonImmutable;
use Carbon\CarbonPeriod;

class BookingPricingService
{
    /**
     * Map of supported duration codes to (label, hours).
     *
     * Hours == 0 means "use the multi-day calendar logic".
     */
    public const DURATIONS = [
        '1H' => ['label' => '1 hour stay', 'hours' => 1],
        '2H' => ['label' => '2 hour stay', 'hours' => 2],
        '3H' => ['label' => '3 hour stay', 'hours' => 3],
        '12H' => ['label' => '12 hour stay', 'hours' => 12],
        'NIGHT' => ['label' => 'Night stay', 'hours' => 12],
        'DAY' => ['label' => 'Day(s) — 24h', 'hours' => 0],
    ];

    /**
     * Default fallback multipliers off `base_price` when the room class has no
     * explicit duration_prices entry yet.
     */
    private const FALLBACK_MULTIPLIERS = [
        '1H' => 0.20,
        '2H' => 0.30,
        '3H' => 0.40,
        '12H' => 0.70,
        'NIGHT' => 0.85,
    ];

    /**
     * Compute room subtotal across the date range, applying weekend pricing where set,
     * and add per-stay / per-night / per-person addons.
     *
     * @param  array<int, array{public_addon_id?:int, name?:string, quantity:int}>  $addons
     * @return array{nights:int, room_subtotal:float, addons:array, addons_subtotal:float, tax_total:float, grand_total:float, currency:string}
     */
    public function quote(
        Hotel $hotel,
        RoomClass $roomClass,
        string $checkIn,
        string $checkOut,
        int $adults,
        int $children,
        array $addons = [],
        string $durationType = 'DAY',
    ): array {
        $start = CarbonImmutable::parse($checkIn)->startOfDay();
        $end = CarbonImmutable::parse($checkOut)->startOfDay();

        if ($durationType === 'DAY') {
            if ($end->lessThanOrEqualTo($start)) {
                throw new \InvalidArgumentException('check_out must be after check_in');
            }

            $nights = $start->diffInDays($end);
            $roomSubtotal = 0.0;

            foreach (CarbonPeriod::between($start, $end->subDay()) as $day) {
                $isWeekend = in_array($day->dayOfWeek, [5, 6], true);
                $nightly = (float) ($isWeekend && $roomClass->weekend_price ? $roomClass->weekend_price : $roomClass->base_price);
                $roomSubtotal += $nightly;
            }

            $extraAdults = max(0, $adults - $roomClass->max_adults);
            $extraChildren = max(0, $children - $roomClass->max_children);
            $roomSubtotal += $extraAdults * (float) $roomClass->extra_adult_price * $nights;
            $roomSubtotal += $extraChildren * (float) $roomClass->extra_child_price * $nights;
        } else {
            // Short-stay / single-night flat pricing.
            $nights = 1;
            $roomSubtotal = $this->priceForDuration($roomClass, $durationType);

            $extraAdults = max(0, $adults - $roomClass->max_adults);
            $extraChildren = max(0, $children - $roomClass->max_children);
            $roomSubtotal += $extraAdults * (float) $roomClass->extra_adult_price;
            $roomSubtotal += $extraChildren * (float) $roomClass->extra_child_price;
        }

        $resolvedAddons = [];
        $addonsSubtotal = 0.0;
        foreach ($addons as $entry) {
            $qty = max(1, (int) ($entry['quantity'] ?? 1));
            if (! empty($entry['public_addon_id'])) {
                $addon = PublicAddon::where('hotel_id', $hotel->id)->where('id', $entry['public_addon_id'])->first();
                if (! $addon || ! $addon->is_active) {
                    continue;
                }
                $unit = (float) $addon->price;
                $multiplier = match ($addon->charge_type) {
                    'PER_NIGHT' => $nights,
                    'PER_PERSON' => max(1, $adults + $children),
                    'PER_PERSON_PER_NIGHT' => max(1, $adults + $children) * $nights,
                    default => 1,
                };
                $subtotal = $unit * $qty * $multiplier;
                $resolvedAddons[] = [
                    'public_addon_id' => $addon->id,
                    'name' => $addon->name,
                    'description' => $addon->description,
                    'quantity' => $qty,
                    'unit_price' => $unit,
                    'subtotal' => round($subtotal, 2),
                ];
                $addonsSubtotal += $subtotal;
            }
        }

        $taxRate = (float) ($hotel->default_tax_rate ?? 0);
        $taxableBase = $hotel->tax_mode === 'INCLUSIVE'
            ? ($roomSubtotal + $addonsSubtotal) - (($roomSubtotal + $addonsSubtotal) / (1 + $taxRate / 100))
            : ($roomSubtotal + $addonsSubtotal) * ($taxRate / 100);

        $taxTotal = round($taxableBase, 2);
        $grandTotal = $hotel->tax_mode === 'INCLUSIVE'
            ? round($roomSubtotal + $addonsSubtotal, 2)
            : round($roomSubtotal + $addonsSubtotal + $taxTotal, 2);

        return [
            'nights' => $nights,
            'duration_type' => $durationType,
            'duration_hours' => self::DURATIONS[$durationType]['hours'] ?? 0,
            'room_subtotal' => round($roomSubtotal, 2),
            'addons' => $resolvedAddons,
            'addons_subtotal' => round($addonsSubtotal, 2),
            'tax_total' => $taxTotal,
            'grand_total' => $grandTotal,
            'currency' => $hotel->currency ?? 'USD',
        ];
    }

    /**
     * Resolve the price for a non-DAY duration. Falls back to a multiplier of
     * base_price if the room class has not configured an explicit price for
     * the given duration code.
     */
    public function priceForDuration(RoomClass $roomClass, string $durationType): float
    {
        $configured = $roomClass->duration_prices ?? [];
        if (isset($configured[$durationType]) && is_numeric($configured[$durationType])) {
            return (float) $configured[$durationType];
        }

        $multiplier = self::FALLBACK_MULTIPLIERS[$durationType] ?? 1.0;

        return round((float) $roomClass->base_price * $multiplier, 2);
    }
}
