<?php

namespace App\Services;

use App\Models\OnboardingRequest;
use App\Models\Tenant;
use App\Models\Tenant\Hotel;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Stancl\Tenancy\Database\Models\Domain;

class TenantProvisioningService
{
    /**
     * Approve an onboarding request, dynamically provision a new tenant DB,
     * register the subdomain, and create the hotel-admin user account.
     *
     * @return array{tenant: Tenant, user: User, temp_password: string}
     */
    public function approve(OnboardingRequest $onboarding, User $approver): array
    {
        // We don't wrap this in a single DB::transaction because tenancy switches the
        // active DB connection and that would break central-connection commits.
        $tenantId = (string) Str::uuid();

        // 1. Create central tenant + domain rows. stancl/tenancy creates and migrates
        //    the tenant DB synchronously via its TenantCreated event pipeline.
        $tenant = Tenant::create([
            'id' => $tenantId,
            'name' => $onboarding->hotel_name,
            'legal_name' => $onboarding->legal_name,
            'contact_email' => $onboarding->contact_email,
            'contact_phone' => $onboarding->contact_phone,
            'country' => $onboarding->country,
            'city' => $onboarding->city,
            'package_id' => $onboarding->package_id,
            'status' => 'ACTIVE',
        ]);

        $tenant->domains()->create(['domain' => $onboarding->desired_subdomain]);

        // 2. Pre-create the hotel admin user on the central registry.
        $tempPassword = Str::password(12, true, true, false);
        $admin = User::create([
            'name' => $onboarding->contact_name,
            'email' => $onboarding->contact_email,
            'password' => Hash::make($tempPassword),
            'role' => User::ROLE_HOTEL_ADMIN,
            'tenant_id' => $tenant->id,
            'phone' => $onboarding->contact_phone,
        ]);

        $onboarding->update([
            'status' => OnboardingRequest::STATUS_APPROVED,
            'tenant_id' => $tenant->id,
            'reviewed_by' => $approver->id,
            'reviewed_at' => now(),
        ]);

        // 3. Seed the tenant DB with a default hotel record + booking-engine config.
        $tenant->run(function () use ($tenant, $onboarding) {
            Hotel::firstOrCreate(
                ['slug' => Str::slug($onboarding->desired_subdomain)],
                [
                    'name' => $onboarding->hotel_name,
                    'description' => 'Welcome to '.$onboarding->hotel_name.'.',
                    'city' => $onboarding->city,
                    'country' => $onboarding->country,
                    'email' => $onboarding->contact_email,
                    'phone' => $onboarding->contact_phone,
                    'currency' => $tenant->currency ?? 'USD',
                    'timezone' => $tenant->timezone ?? 'UTC',
                ],
            );
        });

        return [
            'tenant' => $tenant->fresh(),
            'user' => $admin,
            'temp_password' => $tempPassword,
        ];
    }

    public function reject(OnboardingRequest $onboarding, User $approver, string $reason): OnboardingRequest
    {
        $onboarding->update([
            'status' => OnboardingRequest::STATUS_REJECTED,
            'rejection_reason' => $reason,
            'reviewed_by' => $approver->id,
            'reviewed_at' => now(),
        ]);

        return $onboarding->fresh();
    }
}
