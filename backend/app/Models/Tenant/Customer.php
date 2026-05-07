<?php

namespace App\Models\Tenant;

use Illuminate\Database\Eloquent\Model;

class Customer extends Model
{
    protected $fillable = [
        'hotel_id', 'first_name', 'last_name', 'email', 'phone',
        'date_of_birth', 'gender', 'nationality',
        'address_line1', 'city', 'state', 'country', 'postal_code',
        'id_type', 'id_number', 'id_front_url', 'id_back_url', 'signature_url',
        'preferences', 'notes', 'total_stays', 'lifetime_value',
    ];

    protected $casts = [
        'date_of_birth' => 'date',
        'preferences' => 'array',
        'lifetime_value' => 'decimal:2',
    ];

    public function hotel()
    {
        return $this->belongsTo(Hotel::class);
    }

    public function bookings()
    {
        return $this->hasMany(Booking::class);
    }

    public function getFullNameAttribute(): string
    {
        return trim($this->first_name.' '.($this->last_name ?? ''));
    }
}
