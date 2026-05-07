<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\Package;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class PackageController extends Controller
{
    public function index(Request $request)
    {
        return Package::query()
            ->orderBy('sort_order')
            ->orderBy('monthly_price')
            ->paginate($request->integer('per_page', 50));
    }

    public function publicIndex()
    {
        return Package::query()
            ->where('is_public', true)
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->orderBy('monthly_price')
            ->get();
    }

    public function show(Package $package)
    {
        return $package;
    }

    public function store(Request $request)
    {
        $data = $this->validateData($request);
        $data['slug'] ??= Str::slug($data['name']);

        return Package::create($data);
    }

    public function update(Request $request, Package $package)
    {
        $data = $this->validateData($request, $package->id);
        $package->update($data);

        return $package->fresh();
    }

    public function destroy(Package $package)
    {
        $package->delete();

        return response()->json(['message' => 'Package deleted.']);
    }

    private function validateData(Request $request, ?int $ignoreId = null): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:80'],
            'slug' => ['nullable', 'string', 'max:80', 'unique:packages,slug'.($ignoreId ? ",{$ignoreId}" : '')],
            'description' => ['nullable', 'string', 'max:2000'],
            'monthly_price' => ['required', 'numeric', 'min:0'],
            'yearly_price' => ['nullable', 'numeric', 'min:0'],
            'currency' => ['required', 'string', 'size:3'],
            'max_hotels' => ['required', 'integer', 'min:1'],
            'max_rooms' => ['required', 'integer', 'min:1'],
            'max_staff' => ['required', 'integer', 'min:1'],
            'features' => ['nullable', 'array'],
            'is_public' => ['boolean'],
            'is_active' => ['boolean'],
            'sort_order' => ['nullable', 'integer'],
        ]);
    }
}
