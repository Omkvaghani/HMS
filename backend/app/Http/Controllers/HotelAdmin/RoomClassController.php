<?php

namespace App\Http\Controllers\HotelAdmin;

use App\Http\Controllers\Controller;
use App\Models\Tenant\RoomClass;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class RoomClassController extends Controller
{
    public function index(Request $request)
    {
        $query = RoomClass::query();
        if ($hotelId = $request->query('hotel_id')) {
            $query->where('hotel_id', $hotelId);
        }

        return $query->orderBy('sort_order')->orderBy('name')->get();
    }

    public function show(RoomClass $roomClass)
    {
        return $roomClass;
    }

    public function store(Request $request)
    {
        $data = $this->validateData($request);
        $data['slug'] ??= Str::slug($data['name']);

        return RoomClass::create($data);
    }

    public function update(Request $request, RoomClass $roomClass)
    {
        $roomClass->update($this->validateData($request, $roomClass));

        return $roomClass->fresh();
    }

    public function destroy(RoomClass $roomClass)
    {
        $roomClass->delete();

        return response()->json(['message' => 'Room class deleted.']);
    }

    private function validateData(Request $request, ?RoomClass $existing = null): array
    {
        $hotelId = $request->input('hotel_id', $existing?->hotel_id);

        return $request->validate([
            'hotel_id' => ['required', 'integer', 'exists:hotels,id'],
            'name' => ['required', 'string', 'max:80'],
            'slug' => ['nullable', 'string', 'max:80'],
            'description' => ['nullable', 'string'],
            'max_adults' => ['required', 'integer', 'min:1', 'max:20'],
            'max_children' => ['required', 'integer', 'min:0', 'max:20'],
            'max_occupancy' => ['required', 'integer', 'min:1', 'max:30'],
            'bed_count' => ['required', 'integer', 'min:1', 'max:10'],
            'bed_type' => ['nullable', 'string', 'max:40'],
            'base_price' => ['required', 'numeric', 'min:0'],
            'weekend_price' => ['nullable', 'numeric', 'min:0'],
            'extra_adult_price' => ['nullable', 'numeric', 'min:0'],
            'extra_child_price' => ['nullable', 'numeric', 'min:0'],
            'amenities' => ['nullable', 'array'],
            'image_urls' => ['nullable', 'array'],
            'size_sqft' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['boolean'],
            'sort_order' => ['nullable', 'integer'],
        ]);
    }
}
