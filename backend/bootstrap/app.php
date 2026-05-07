<?php

use App\Http\Middleware\EnsureRole;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->statefulApi();

        $middleware->alias([
            'role' => EnsureRole::class,
            'tenant.user' => \App\Http\Middleware\InitializeTenancyByUser::class,
            'tenant.subdomain.param' => \App\Http\Middleware\InitializeTenancyBySubdomainParam::class,
            'tenant.subdomain' => \Stancl\Tenancy\Middleware\InitializeTenancyBySubdomain::class,
            'tenant.domain' => \Stancl\Tenancy\Middleware\InitializeTenancyByDomain::class,
            'tenant.header' => \Stancl\Tenancy\Middleware\InitializeTenancyByRequestData::class,
        ]);

        // Token-only Sanctum endpoints (no session cookie required).
        $middleware->api(prepend: [
            \Illuminate\Http\Middleware\HandleCors::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        $exceptions->render(function (\Stancl\Tenancy\Exceptions\TenantCouldNotBeIdentifiedException $e, $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                return response()->json(['message' => 'Hotel not found.'], 404);
            }
        });
    })->create();
