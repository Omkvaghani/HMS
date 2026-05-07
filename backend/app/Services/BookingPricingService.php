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
    ): array {
        $start = CarbonImmutable::parse($checkIn)->startOfDay();
        $end = CarbonImmutable::parse($checkOut)->startOfDay();

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
            'room_subtotal' => round($roomSubtotal, 2),
            'addons' => $resolvedAddons,
            'addons_subtotal' => round($addonsSubtotal, 2),
            'tax_total' => $taxTotal,
            'grand_total' => $grandTotal,
            'currency' => $hotel->currency ?? 'USD',
        ];
    }
}
