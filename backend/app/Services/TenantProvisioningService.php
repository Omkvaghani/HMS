<?php

namespace App\Services;

use App\Models\OnboardingRequest;
use App\Models\Tenant;
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
        return DB::transaction(function () use ($onboarding, $approver) {
            $tenantId = (string) Str::uuid();

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

            // Map subdomain → tenant. central_domains acts as the parent host.
            $tenant->domains()->create([
                'domain' => $onboarding->desired_subdomain,
            ]);

            // Pre-create the hotel admin's central account so they can log in immediately.
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

            // Stancl/Tenancy creates and migrates the tenant DB via its TenantCreated event pipeline.
            // After that pipeline runs, seed the tenant DB with a default hotel + booking engine config.
            $tenant->run(function () use ($tenant, $onboarding) {
                \App\Models\Tenant\Hotel::firstOrCreate(
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
        });
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
