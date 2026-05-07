<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TenantController extends Controller
{
    public function index(Request $request)
    {
        $query = Tenant::query()->with('domains', 'package');

        if ($status = $request->query('status')) {
            $query->where('status', strtoupper($status));
        }

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('contact_email', 'like', "%{$search}%")
                    ->orWhere('id', 'like', "%{$search}%");
            });
        }

        return $query->latest('created_at')->paginate($request->integer('per_page', 20));
    }

    public function show(Tenant $tenant)
    {
        return $tenant->load('domains', 'package');
    }

    public function suspend(Tenant $tenant)
    {
        $tenant->update(['status' => 'SUSPENDED']);

        return response()->json(['message' => 'Tenant suspended.', 'tenant' => $tenant->fresh()]);
    }

    public function activate(Tenant $tenant)
    {
        $tenant->update(['status' => 'ACTIVE']);

        return response()->json(['message' => 'Tenant activated.', 'tenant' => $tenant->fresh()]);
    }

    public function stats()
    {
        return response()->json([
            'total' => Tenant::count(),
            'active' => Tenant::where('status', 'ACTIVE')->count(),
            'pending' => Tenant::where('status', 'PENDING')->count(),
            'suspended' => Tenant::where('status', 'SUSPENDED')->count(),
            'rejected' => Tenant::where('status', 'REJECTED')->count(),
            'created_this_month' => Tenant::where('created_at', '>=', now()->startOfMonth())->count(),
        ]);
    }

    public function health()
    {
        $rows = Tenant::all()->map(function (Tenant $tenant) {
            $ok = false;
            $error = null;
            try {
                $tenant->run(function () use (&$ok) {
                    DB::connection()->getPdo();
                    $ok = (bool) DB::table('hotels')->limit(1)->exists() || true; // table exists
                });
            } catch (\Throwable $e) {
                $error = $e->getMessage();
            }

            return [
                'id' => $tenant->id,
                'name' => $tenant->name,
                'status' => $tenant->status,
                'db_ok' => $ok,
                'error' => $error,
                'domains' => $tenant->domains->pluck('domain'),
            ];
        });

        return response()->json([
            'central_db' => true,
            'tenants' => $rows,
        ]);
    }
}
