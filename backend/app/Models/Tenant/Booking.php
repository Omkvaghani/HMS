<?php

namespace App\Models\Tenant;

use Illuminate\Database\Eloquent\Model;

class Booking extends Model
{
    public const STATUS_PENDING = 'PENDING';

    public const STATUS_CONFIRMED = 'CONFIRMED';

    public const STATUS_CHECKED_IN = 'CHECKED_IN';

    public const STATUS_CHECKED_OUT = 'CHECKED_OUT';

    public const STATUS_CANCELLED = 'CANCELLED';

    public const STATUS_NO_SHOW = 'NO_SHOW';

    protected $fillable = [
        'reference', 'hotel_id', 'customer_id', 'room_class_id', 'room_id',
        'source', 'status', 'payment_status',
        'check_in_date', 'check_out_date', 'checked_in_at', 'checked_out_at',
        'adults', 'children', 'nights',
        'room_subtotal', 'addons_subtotal', 'discount_total', 'tax_total',
        'grand_total', 'amount_paid', 'amount_due', 'currency',
        'special_requests', 'internal_notes', 'guest_snapshot', 'pricing_snapshot',
    ];

    protected $casts = [
        'check_in_date' => 'date',
        'check_out_date' => 'date',
        'checked_in_at' => 'datetime',
        'checked_out_at' => 'datetime',
        'guest_snapshot' => 'array',
        'pricing_snapshot' => 'array',
        'room_subtotal' => 'decimal:2',
        'addons_subtotal' => 'decimal:2',
        'discount_total' => 'decimal:2',
        'tax_total' => 'decimal:2',
        'grand_total' => 'decimal:2',
        'amount_paid' => 'decimal:2',
        'amount_due' => 'decimal:2',
    ];

    public function hotel()
    {
        return $this->belongsTo(Hotel::class);
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function roomClass()
    {
        return $this->belongsTo(RoomClass::class);
    }

    public function room()
    {
        return $this->belongsTo(Room::class);
    }

    public function addons()
    {
        return $this->hasMany(BookingAddon::class);
    }

    public function payments()
    {
        return $this->hasMany(BookingPayment::class);
    }
}
