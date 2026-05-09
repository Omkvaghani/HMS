<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\OnboardingRequest;
use App\Services\TenantProvisioningService;
use Illuminate\Http\Request;

class OnboardingController extends Controller
{
    public function index(Request $request)
    {
        $query = OnboardingRequest::query()->with('package', 'reviewer');

        if ($status = $request->query('status')) {
            $query->where('status', strtoupper($status));
        }

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('hotel_name', 'like', "%{$search}%")
                    ->orWhere('contact_email', 'like', "%{$search}%")
                    ->orWhere('desired_subdomain', 'like', "%{$search}%");
            });
        }

        return $query->latest()->paginate($request->integer('per_page', 20));
    }

    public function show(OnboardingRequest $onboardingRequest)
    {
        return $onboardingRequest->load('package', 'reviewer', 'tenant');
    }

    public function approve(Request $request, OnboardingRequest $onboardingRequest, TenantProvisioningService $service)
    {
        if ($onboardingRequest->status !== OnboardingRequest::STATUS_PENDING) {
            return response()->json(['message' => 'This request has already been reviewed.'], 422);
        }

        $result = $service->approve($onboardingRequest, $request->user());

        return response()->json([
            'message' => 'Hotel approved and tenant database provisioned.',
            'tenant' => $result['tenant'],
            'admin_user' => $result['user']->only(['id', 'email', 'name']),
            'temporary_password' => $result['temp_password'],
        ]);
    }

    public function reject(Request $request, OnboardingRequest $onboardingRequest, TenantProvisioningService $service)
    {
        $data = $request->validate([
            'reason' => ['required', 'string', 'max:500'],
        ]);

        if ($onboardingRequest->status !== OnboardingRequest::STATUS_PENDING) {
            return response()->json(['message' => 'This request has already been reviewed.'], 422);
        }

        $updated = $service->reject($onboardingRequest, $request->user(), $data['reason']);

        return response()->json([
            'message' => 'Onboarding request rejected.',
            'request' => $updated,
        ]);
    }

    /** Public endpoint: anyone can submit a hotel onboarding request. */
    public function submit(Request $request)
    {
        $data = $request->validate([
            'hotel_name' => ['required', 'string', 'max:120'],
            'legal_name' => ['nullable', 'string', 'max:160'],
            'contact_name' => ['required', 'string', 'max:120'],
            'contact_email' => ['required', 'email', 'max:160'],
            'contact_phone' => ['nullable', 'string', 'max:32'],
            'country' => ['nullable', 'string', 'size:2'],
            'city' => ['nullable', 'string', 'max:80'],
            'desired_subdomain' => ['required', 'string', 'min:3', 'max:60', 'regex:/^[a-z0-9-]+$/', 'unique:domains,domain'],
            'package_id' => ['nullable', 'exists:packages,id'],
            'message' => ['nullable', 'string', 'max:1000'],
        ]);

        $onboarding = OnboardingRequest::create($data);

        return response()->json([
            'message' => 'Thanks! Your application is in review. We will email you shortly.',
            'request' => $onboarding,
        ], 201);
    }
}
