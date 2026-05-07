<?php

namespace Database\Seeders;

use App\Models\Package;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->seedSuperAdmin();
        $this->seedPackages();
    }

    private function seedSuperAdmin(): void
    {
        User::firstOrCreate(
            ['email' => 'admin@hms.local'],
            [
                'name' => 'Platform Admin',
                'password' => Hash::make('password'),
                'role' => User::ROLE_SUPER_ADMIN,
                'is_active' => true,
            ],
        );
    }

    private function seedPackages(): void
    {
        $packages = [
            [
                'name' => 'Starter', 'slug' => 'starter',
                'description' => 'For small properties getting started with direct bookings.',
                'monthly_price' => 49, 'yearly_price' => 490, 'currency' => 'USD',
                'max_hotels' => 1, 'max_rooms' => 25, 'max_staff' => 5,
                'features' => ['Booking calendar', 'Public booking engine', 'Email support'],
                'is_public' => true, 'is_active' => true, 'sort_order' => 1,
            ],
            [
                'name' => 'Boutique', 'slug' => 'boutique',
                'description' => 'For independent boutique hotels with custom branding.',
                'monthly_price' => 129, 'yearly_price' => 1290, 'currency' => 'USD',
                'max_hotels' => 1, 'max_rooms' => 100, 'max_staff' => 20,
                'features' => ['Everything in Starter', 'Branded booking engine', 'Add-ons & upsells', 'Reports'],
                'is_public' => true, 'is_active' => true, 'sort_order' => 2,
            ],
            [
                'name' => 'Group', 'slug' => 'group',
                'description' => 'Multi-property groups with centralized governance.',
                'monthly_price' => 349, 'yearly_price' => 3490, 'currency' => 'USD',
                'max_hotels' => 10, 'max_rooms' => 1000, 'max_staff' => 250,
                'features' => ['Everything in Boutique', 'Multi-property dashboard', 'Priority support', 'Custom integrations'],
                'is_public' => true, 'is_active' => true, 'sort_order' => 3,
            ],
        ];

        foreach ($packages as $p) {
            Package::firstOrCreate(['slug' => $p['slug']], $p);
        }
    }
}
