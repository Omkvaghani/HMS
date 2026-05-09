<?php

namespace App\Models\Tenant;

use Illuminate\Database\Eloquent\Model;

class Hotel extends Model
{
    protected $fillable = [
        'name', 'slug', 'description',
        'address_line1', 'address_line2', 'city', 'state', 'country', 'postal_code',
        'phone', 'email', 'website', 'latitude', 'longitude',
        'logo_url', 'cover_image_url', 'amenities', 'policies',
        'check_in_time', 'check_out_time', 'timezone', 'currency',
        'default_tax_rate', 'tax_mode', 'settings', 'is_active',
    ];

    protected $casts = [
        'amenities' => 'array',
        'policies' => 'array',
        'settings' => 'array',
        'is_active' => 'boolean',
        'default_tax_rate' => 'decimal:2',
        'latitude' => 'decimal:7',
        'longitude' => 'decimal:7',
    ];

    public function rooms()
    {
        return $this->hasMany(Room::class);
    }

    public function roomClasses()
    {
        return $this->hasMany(RoomClass::class);
    }

    public function bookings()
    {
        return $this->hasMany(Booking::class);
    }

    public function customers()
    {
        return $this->hasMany(Customer::class);
    }

    public function bookingEngineConfig()
    {
        return $this->hasOne(BookingEngineConfig::class);
    }

    public function publicAddons()
    {
        return $this->hasMany(PublicAddon::class);
    }

    public function staff()
    {
        return $this->hasMany(Staff::class);
    }

    public function expenses()
    {
        return $this->hasMany(Expense::class);
    }

    public function cashTransactions()
    {
        return $this->hasMany(CashTransaction::class);
    }
}
