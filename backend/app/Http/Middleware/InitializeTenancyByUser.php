<?php

namespace App\Http\Middleware;

use App\Models\Tenant;
use Closure;
use Illuminate\Http\Request;
use Stancl\Tenancy\Tenancy;
use Symfony\Component\HttpFoundation\Response;

/**
 * Initializes tenancy using the authenticated user's tenant_id column.
 * Used for the hotel-admin and staff portals (token-based, no subdomain).
 */
class InitializeTenancyByUser
{
    public function __construct(protected Tenancy $tenancy) {}

    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user || ! $user->tenant_id) {
            return response()->json(['message' => 'No tenant context for this user.'], 403);
        }

        $tenant = Tenant::find($user->tenant_id);
        if (! $tenant) {
            return response()->json(['message' => 'Tenant not found.'], 404);
        }

        if ($tenant->status === 'SUSPENDED') {
            return response()->json(['message' => 'This account is suspended. Contact support.'], 403);
        }

        $this->tenancy->initialize($tenant);

        try {
            return $next($request);
        } finally {
            $this->tenancy->end();
        }
    }
}
