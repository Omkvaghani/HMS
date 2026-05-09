<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Email + password login. Returns a Sanctum personal access token.
     * Used by the React SPAs (token-based auth, no session cookies).
     */
    public function login(Request $request)
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
            'device_name' => ['sometimes', 'string', 'max:120'],
        ]);

        $key = 'login:'.strtolower($data['email']).'|'.$request->ip();
        if (RateLimiter::tooManyAttempts($key, 6)) {
            $seconds = RateLimiter::availableIn($key);
            throw ValidationException::withMessages([
                'email' => ["Too many login attempts. Try again in {$seconds} seconds."],
            ])->status(429);
        }

        $user = User::where('email', $data['email'])->first();

        if (! $user || ! Hash::check($data['password'], $user->password)) {
            RateLimiter::hit($key, 60);
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        if (! $user->is_active) {
            throw ValidationException::withMessages([
                'email' => ['Your account is deactivated. Contact support.'],
            ]);
        }

        RateLimiter::clear($key);

        $deviceName = $data['device_name'] ?? ($request->userAgent() ?: 'browser');
        $token = $user->createToken($deviceName, [$user->role])->plainTextToken;

        return response()->json([
            'token' => $token,
            'user' => $user->only([
                'id', 'name', 'email', 'role', 'tenant_id', 'phone', 'avatar_url',
            ]),
        ]);
    }

    /**
     * Public guest registration — only for the booking-engine flow.
     * Hotel admins / staff are created by the super admin via the onboarding approval flow.
     */
    public function registerGuest(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
            'phone' => ['nullable', 'string', 'max:32'],
        ]);

        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => $data['password'],
            'phone' => $data['phone'] ?? null,
            'role' => User::ROLE_GUEST,
        ]);

        $token = $user->createToken('guest-signup')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user' => $user->only(['id', 'name', 'email', 'role', 'phone']),
        ], 201);
    }

    public function me(Request $request)
    {
        return response()->json([
            'user' => $request->user()->only([
                'id', 'name', 'email', 'role', 'tenant_id', 'phone', 'avatar_url',
            ]),
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()?->delete();

        return response()->json(['message' => 'Logged out.']);
    }
}
