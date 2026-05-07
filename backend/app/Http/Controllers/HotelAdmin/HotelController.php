<?php

namespace App\Http\Controllers\HotelAdmin;

use App\Http\Controllers\Controller;
use App\Models\Tenant\Hotel;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class HotelController extends Controller
{
    public function index()
    {
        return Hotel::orderBy('name')->get();
    }

    public function show(Hotel $hotel)
    {
        return $hotel->load('bookingEngineConfig');
    }

    public function store(Request $request)
    {
        $data = $this->validateData($request);
        $data['slug'] ??= Str::slug($data['name']);

        return Hotel::create($data);
    }

    public function update(Request $request, Hotel $hotel)
    {
        $data = $this->validateData($request, $hotel->id);
        $hotel->update($data);

        return $hotel->fresh();
    }

    public function destroy(Hotel $hotel)
    {
        $hotel->delete();

        return response()->json(['message' => 'Hotel deleted.']);
    }

    private function validateData(Request $request, ?int $ignoreId = null): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'slug' => ['nullable', 'string', 'max:120', 'unique:hotels,slug'.($ignoreId ? ",{$ignoreId}" : '')],
            'description' => ['nullable', 'string'],
            'address_line1' => ['nullable', 'string', 'max:160'],
            'address_line2' => ['nullable', 'string', 'max:160'],
            'city' => ['nullable', 'string', 'max:80'],
            'state' => ['nullable', 'string', 'max:80'],
            'country' => ['nullable', 'string', 'size:2'],
            'postal_code' => ['nullable', 'string', 'max:20'],
            'phone' => ['nullable', 'string', 'max:32'],
            'email' => ['nullable', 'email', 'max:160'],
            'website' => ['nullable', 'url', 'max:200'],
            'latitude' => ['nullable', 'numeric'],
            'longitude' => ['nullable', 'numeric'],
            'logo_url' => ['nullable', 'url'],
            'cover_image_url' => ['nullable', 'url'],
            'amenities' => ['nullable', 'array'],
            'policies' => ['nullable', 'array'],
            'check_in_time' => ['nullable', 'date_format:H:i'],
            'check_out_time' => ['nullable', 'date_format:H:i'],
            'timezone' => ['nullable', 'string', 'max:64'],
            'currency' => ['nullable', 'string', 'size:3'],
            'default_tax_rate' => ['nullable', 'numeric', 'between:0,99.99'],
            'tax_mode' => ['nullable', 'in:INCLUSIVE,EXCLUSIVE'],
            'settings' => ['nullable', 'array'],
            'settings.default_next_day_checkout_time' => ['nullable', 'date_format:H:i'],
            'settings.enabled_duration_types' => ['nullable', 'array'],
            'settings.enabled_duration_types.*' => ['in:1H,2H,3H,12H,NIGHT,DAY'],
            'settings.auto_confirm_online' => ['nullable', 'boolean'],
            'settings.advance_booking_max_days' => ['nullable', 'integer', 'min:1', 'max:730'],
            'settings.theme' => ['nullable', 'in:warm,light,dark'],
            'is_active' => ['boolean'],
        ]);
    }
}
