<?php

namespace App\Models\Tenant;

use Illuminate\Database\Eloquent\Model;

class Staff extends Model
{
    protected $table = 'staff';

    protected $fillable = [
        'hotel_id', 'user_id', 'first_name', 'last_name', 'email', 'phone',
        'job_title', 'department', 'hired_at', 'terminated_at',
        'monthly_salary', 'currency', 'emergency_contact', 'is_active',
    ];

    protected $casts = [
        'hired_at' => 'date',
        'terminated_at' => 'date',
        'emergency_contact' => 'array',
        'monthly_salary' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    public function hotel()
    {
        return $this->belongsTo(Hotel::class);
    }
}
