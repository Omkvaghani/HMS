<?php

namespace App\Http\Controllers\HotelAdmin;

use App\Http\Controllers\Controller;
use App\Models\Tenant\Room;
use Illuminate\Http\Request;

class RoomController extends Controller
{
    public function index(Request $request)
    {
        $query = Room::query()->with('roomClass:id,name,base_price');

        if ($hotelId = $request->query('hotel_id')) {
            $query->where('hotel_id', $hotelId);
        }
        if ($status = $request->query('status')) {
            $query->where('status', strtoupper($status));
        }
        if ($classId = $request->query('room_class_id')) {
            $query->where('room_class_id', $classId);
        }

        return $query->orderBy('floor')->orderBy('room_number')->paginate($request->integer('per_page', 100));
    }

    public function show(Room $room)
    {
        return $room->load('roomClass');
    }

    public function store(Request $request)
    {
        return Room::create($this->validateData($request));
    }

    public function update(Request $request, Room $room)
    {
        $room->update($this->validateData($request, $room));

        return $room->fresh();
    }

    public function updateStatus(Request $request, Room $room)
    {
        $data = $request->validate([
            'status' => ['required', 'in:AVAILABLE,OCCUPIED,CLEANING,MAINTENANCE,OUT_OF_ORDER'],
            'housekeeping_status' => ['nullable', 'in:CLEAN,DIRTY,INSPECTED'],
            'notes' => ['nullable', 'string'],
        ]);

        $room->update($data);

        return $room->fresh();
    }

    public function destroy(Room $room)
    {
        $room->delete();

        return response()->json(['message' => 'Room deleted.']);
    }

    private function validateData(Request $request, ?Room $existing = null): array
    {
        return $request->validate([
            'hotel_id' => ['required', 'integer', 'exists:hotels,id'],
            'room_class_id' => ['required', 'integer', 'exists:room_classes,id'],
            'room_number' => ['required', 'string', 'max:20'],
            'floor' => ['nullable', 'string', 'max:10'],
            'status' => ['nullable', 'in:AVAILABLE,OCCUPIED,CLEANING,MAINTENANCE,OUT_OF_ORDER'],
            'housekeeping_status' => ['nullable', 'in:CLEAN,DIRTY,INSPECTED'],
            'notes' => ['nullable', 'string'],
            'is_active' => ['boolean'],
        ]);
    }
}
