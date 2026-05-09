<?php

namespace App\Http\Controllers\HotelAdmin;

use App\Http\Controllers\Controller;
use App\Models\Tenant\Hotel;
use Illuminate\Http\Request;

class HotelSettingsController extends Controller
{
    public const DEFAULTS = [
        'default_next_day_checkout_time' => '11:00',
        'enabled_duration_types' => ['1H', '2H', '3H', '12H', 'NIGHT', 'DAY'],
        'auto_confirm_online' => true,
        'advance_booking_max_days' => 365,
        'theme' => 'warm',
    ];

    public function show(Hotel $hotel)
    {
        return [
            'hotel_id' => $hotel->id,
            'name' => $hotel->name,
            'check_in_time' => $hotel->check_in_time,
            'check_out_time' => $hotel->check_out_time,
            'currency' => $hotel->currency,
            'timezone' => $hotel->timezone,
            'default_tax_rate' => $hotel->default_tax_rate,
            'tax_mode' => $hotel->tax_mode,
            'settings' => array_merge(self::DEFAULTS, $hotel->settings ?? []),
        ];
    }

    public function update(Request $request, Hotel $hotel)
    {
        $data = $request->validate([
            'check_in_time' => ['nullable', 'date_format:H:i'],
            'check_out_time' => ['nullable', 'date_format:H:i'],
            'currency' => ['nullable', 'string', 'size:3'],
            'timezone' => ['nullable', 'string', 'max:64'],
            'default_tax_rate' => ['nullable', 'numeric', 'between:0,99.99'],
            'tax_mode' => ['nullable', 'in:INCLUSIVE,EXCLUSIVE'],
            'settings' => ['nullable', 'array'],
            'settings.default_next_day_checkout_time' => ['nullable', 'date_format:H:i'],
            'settings.enabled_duration_types' => ['nullable', 'array'],
            'settings.enabled_duration_types.*' => ['in:1H,2H,3H,12H,NIGHT,DAY'],
            'settings.auto_confirm_online' => ['nullable', 'boolean'],
            'settings.advance_booking_max_days' => ['nullable', 'integer', 'min:1', 'max:730'],
            'settings.theme' => ['nullable', 'in:warm,light,dark'],
        ]);

        if (isset($data['settings'])) {
            $data['settings'] = array_merge($hotel->settings ?? [], $data['settings']);
        }

        $hotel->update($data);

        return $this->show($hotel->fresh());
    }
}
