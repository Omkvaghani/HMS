<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Package extends Model
{
    protected $fillable = [
        'name', 'slug', 'description',
        'monthly_price', 'yearly_price', 'currency',
        'max_hotels', 'max_rooms', 'max_staff',
        'features', 'is_public', 'is_active', 'sort_order',
    ];

    protected $casts = [
        'features' => 'array',
        'is_public' => 'boolean',
        'is_active' => 'boolean',
        'monthly_price' => 'decimal:2',
        'yearly_price' => 'decimal:2',
    ];

    public function tenants()
    {
        return $this->hasMany(Tenant::class);
    }
}
