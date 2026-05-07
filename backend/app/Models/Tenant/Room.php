<?php

namespace App\Models\Tenant;

use Illuminate\Database\Eloquent\Model;

class Room extends Model
{
    public const STATUS_AVAILABLE = 'AVAILABLE';
    public const STATUS_OCCUPIED = 'OCCUPIED';
    public const STATUS_CLEANING = 'CLEANING';
    public const STATUS_MAINTENANCE = 'MAINTENANCE';
    public const STATUS_OUT_OF_ORDER = 'OUT_OF_ORDER';

    protected $fillable = [
        'hotel_id', 'room_class_id',
        'room_number', 'floor',
        'status', 'housekeeping_status', 'notes', 'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function hotel()
    {
        return $this->belongsTo(Hotel::class);
    }

    public function roomClass()
    {
        return $this->belongsTo(RoomClass::class);
    }
}
