<?php

namespace App\Models;

use Stancl\Tenancy\Contracts\TenantWithDatabase;
use Stancl\Tenancy\Database\Concerns\HasDatabase;
use Stancl\Tenancy\Database\Concerns\HasDomains;
use Stancl\Tenancy\Database\Models\Tenant as BaseTenant;

class Tenant extends BaseTenant implements TenantWithDatabase
{
    use HasDatabase;
    use HasDomains;

    protected $casts = [
        'trial_ends_at' => 'datetime',
        'subscription_ends_at' => 'datetime',
    ];

    public static function getCustomColumns(): array
    {
        return [
            'id',
            'name',
            'legal_name',
            'contact_email',
            'contact_phone',
            'country',
            'city',
            'timezone',
            'currency',
            'status',
            'package_id',
            'trial_ends_at',
            'subscription_ends_at',
        ];
    }

    public function package()
    {
        return $this->belongsTo(Package::class);
    }
}
