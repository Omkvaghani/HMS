<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Stancl\Tenancy\Database\Models\Domain;
use Stancl\Tenancy\Tenancy;
use Symfony\Component\HttpFoundation\Response;

/**
 * Resolves the tenant by the `{subdomain}` route parameter (used by the public
 * booking-engine API: /api/v1/public/{subdomain}/...). This avoids requiring
 * actual DNS subdomains during local development.
 */
class InitializeTenancyBySubdomainParam
{
    public function __construct(protected Tenancy $tenancy) {}

    public function handle(Request $request, Closure $next): Response
    {
        $subdomain = $request->route('subdomain');
        if (! $subdomain) {
            return response()->json(['message' => 'Subdomain missing in URL.'], 400);
        }

        $domain = Domain::where('domain', $subdomain)->first();
        if (! $domain) {
            return response()->json(['message' => 'Hotel not found.'], 404);
        }

        $tenant = $domain->tenant;
        if (! $tenant || $tenant->status === 'SUSPENDED') {
            return response()->json(['message' => 'This hotel is not currently available.'], 403);
        }

        $this->tenancy->initialize($tenant);

        try {
            return $next($request);
        } finally {
            $this->tenancy->end();
        }
    }
}
