<?php

namespace App\Models\Tenant;

use Illuminate\Database\Eloquent\Model;

class PublicAddon extends Model
{
    protected $fillable = [
        'hotel_id', 'name', 'description', 'price', 'charge_type',
        'image_url', 'is_active', 'sort_order',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    public function hotel()
    {
        return $this->belongsTo(Hotel::class);
    }
}
