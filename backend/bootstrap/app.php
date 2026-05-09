<?php

use App\Http\Middleware\EnsureRole;
use App\Http\Middleware\InitializeTenancyBySubdomainParam;
use App\Http\Middleware\InitializeTenancyByUser;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\HandleCors;
use Stancl\Tenancy\Exceptions\TenantCouldNotBeIdentifiedException;
use Stancl\Tenancy\Middleware\InitializeTenancyByDomain;
use Stancl\Tenancy\Middleware\InitializeTenancyByRequestData;
use Stancl\Tenancy\Middleware\InitializeTenancyBySubdomain;

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
            'tenant.user' => InitializeTenancyByUser::class,
            'tenant.subdomain.param' => InitializeTenancyBySubdomainParam::class,
            'tenant.subdomain' => InitializeTenancyBySubdomain::class,
            'tenant.domain' => InitializeTenancyByDomain::class,
            'tenant.header' => InitializeTenancyByRequestData::class,
        ]);

        // Token-only Sanctum endpoints (no session cookie required).
        $middleware->api(prepend: [
            HandleCors::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        $exceptions->render(function (TenantCouldNotBeIdentifiedException $e, $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                return response()->json(['message' => 'Hotel not found.'], 404);
            }
        });
    })->create();
