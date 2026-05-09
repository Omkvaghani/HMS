<?php

namespace App\Models\Tenant;

use Illuminate\Database\Eloquent\Model;

class RoomClass extends Model
{
    protected $fillable = [
        'hotel_id', 'name', 'slug', 'description',
        'max_adults', 'max_children', 'max_occupancy',
        'bed_count', 'bed_type',
        'base_price', 'weekend_price', 'duration_prices',
        'extra_adult_price', 'extra_child_price',
        'amenities', 'image_urls', 'size_sqft',
        'is_active', 'sort_order',
    ];

    protected $casts = [
        'amenities' => 'array',
        'image_urls' => 'array',
        'duration_prices' => 'array',
        'is_active' => 'boolean',
        'base_price' => 'decimal:2',
        'weekend_price' => 'decimal:2',
        'extra_adult_price' => 'decimal:2',
        'extra_child_price' => 'decimal:2',
    ];

    public function hotel()
    {
        return $this->belongsTo(Hotel::class);
    }

    public function rooms()
    {
        return $this->hasMany(Room::class);
    }
}
