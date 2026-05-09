<?php

use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\HotelAdmin\BookingController;
use App\Http\Controllers\HotelAdmin\CashController;
use App\Http\Controllers\HotelAdmin\CustomerController;
use App\Http\Controllers\HotelAdmin\DashboardController;
use App\Http\Controllers\HotelAdmin\ExpenseController;
use App\Http\Controllers\HotelAdmin\HotelController;
use App\Http\Controllers\HotelAdmin\HotelSettingsController;
use App\Http\Controllers\HotelAdmin\RoomClassController;
use App\Http\Controllers\HotelAdmin\RoomController;
use App\Http\Controllers\HotelAdmin\StaffController;
use App\Http\Controllers\Public\BookingEngineController;
use App\Http\Controllers\SuperAdmin\OnboardingController;
use App\Http\Controllers\SuperAdmin\PackageController;
use App\Http\Controllers\SuperAdmin\TenantController;
use Illuminate\Support\Facades\Route;

// ---------------------------------------------------------------------------
// Central / public routes (no tenant context)
// ---------------------------------------------------------------------------
Route::prefix('v1')->group(function () {

    // --- Auth (works on the central host for super-admins and hotel-admins) ---
    Route::post('auth/login', [AuthController::class, 'login']);
    Route::post('auth/register', [AuthController::class, 'registerGuest']);
    Route::middleware('auth:sanctum')->group(function () {
        Route::get('auth/me', [AuthController::class, 'me']);
        Route::post('auth/logout', [AuthController::class, 'logout']);
    });

    // --- Public marketing site / packages / onboarding ---
    Route::get('packages', [PackageController::class, 'publicIndex']);
    Route::post('onboarding-requests', [OnboardingController::class, 'submit']);

    // --- Super Admin ---
    Route::middleware(['auth:sanctum', 'role:SUPER_ADMIN'])->prefix('super-admin')->group(function () {
        Route::get('onboarding-requests', [OnboardingController::class, 'index']);
        Route::get('onboarding-requests/{onboardingRequest}', [OnboardingController::class, 'show']);
        Route::post('onboarding-requests/{onboardingRequest}/approve', [OnboardingController::class, 'approve']);
        Route::post('onboarding-requests/{onboardingRequest}/reject', [OnboardingController::class, 'reject']);

        Route::apiResource('packages', PackageController::class);

        Route::get('tenants', [TenantController::class, 'index']);
        Route::get('tenants/stats', [TenantController::class, 'stats']);
        Route::get('tenants/health', [TenantController::class, 'health']);
        Route::get('tenants/{tenant}', [TenantController::class, 'show']);
        Route::post('tenants/{tenant}/suspend', [TenantController::class, 'suspend']);
        Route::post('tenants/{tenant}/activate', [TenantController::class, 'activate']);
    });

    // --- Hotel Admin (authenticated user's tenant_id is used to switch DB) ---
    Route::middleware(['auth:sanctum', 'role:HOTEL_ADMIN,STAFF', 'tenant.user'])->prefix('hotel-admin')->group(function () {
        Route::get('dashboard', [DashboardController::class, 'summary']);

        Route::apiResource('hotels', HotelController::class);
        Route::apiResource('room-classes', RoomClassController::class);
        Route::apiResource('rooms', RoomController::class);
        Route::patch('rooms/{room}/status', [RoomController::class, 'updateStatus']);
        Route::apiResource('customers', CustomerController::class);

        Route::get('bookings/calendar', [BookingController::class, 'calendar']);
        Route::apiResource('bookings', BookingController::class)->except(['destroy']);
        Route::post('bookings/{booking}/check-in', [BookingController::class, 'checkIn']);
        Route::post('bookings/{booking}/check-out', [BookingController::class, 'checkOut']);
        Route::post('bookings/{booking}/cancel', [BookingController::class, 'cancel']);
        Route::post('bookings/{booking}/payments', [BookingController::class, 'recordPayment']);

        Route::apiResource('staff', StaffController::class);

        Route::get('expenses/summary', [ExpenseController::class, 'summary']);
        Route::apiResource('expenses', ExpenseController::class);

        Route::get('cash/summary', [CashController::class, 'summary']);
        Route::get('cash', [CashController::class, 'index']);
        Route::post('cash', [CashController::class, 'store']);
        Route::delete('cash/{cashTransaction}', [CashController::class, 'destroy']);

        Route::get('hotels/{hotel}/settings', [HotelSettingsController::class, 'show']);
        Route::put('hotels/{hotel}/settings', [HotelSettingsController::class, 'update']);
    });

    // --- Public Booking Engine: tenant resolved from {subdomain} route param ---
    Route::middleware(['tenant.subdomain.param'])->prefix('public/{subdomain}')->group(function () {
        Route::get('branding', [BookingEngineController::class, 'branding']);
        Route::get('availability', [BookingEngineController::class, 'availability']);
        Route::post('quote', [BookingEngineController::class, 'quote']);
        Route::post('book', [BookingEngineController::class, 'book']);
    });
});
