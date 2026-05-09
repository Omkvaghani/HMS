<?php

namespace App\Http\Controllers\HotelAdmin;

use App\Http\Controllers\Controller;
use App\Models\Tenant\Staff;
use Illuminate\Http\Request;

class StaffController extends Controller
{
    public function index(Request $request)
    {
        $query = Staff::query()->with('hotel:id,name');
        if ($hotelId = $request->query('hotel_id')) {
            $query->where('hotel_id', $hotelId);
        }
        if ($active = $request->query('active')) {
            $query->where('is_active', filter_var($active, FILTER_VALIDATE_BOOLEAN));
        }
        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%")
                    ->orWhere('job_title', 'like', "%{$search}%");
            });
        }

        return $query->orderBy('first_name')->paginate($request->integer('per_page', 50));
    }

    public function show(Staff $staff)
    {
        return $staff->load('hotel:id,name');
    }

    public function store(Request $request)
    {
        return Staff::create($this->validateData($request));
    }

    public function update(Request $request, Staff $staff)
    {
        $staff->update($this->validateData($request, $staff->id));

        return $staff->fresh();
    }

    public function destroy(Staff $staff)
    {
        $staff->delete();

        return response()->json(['message' => 'Staff member deleted.']);
    }

    private function validateData(Request $request, ?int $ignoreId = null): array
    {
        return $request->validate([
            'hotel_id' => ['required', 'integer', 'exists:hotels,id'],
            'user_id' => ['nullable', 'integer'],
            'first_name' => ['required', 'string', 'max:80'],
            'last_name' => ['nullable', 'string', 'max:80'],
            'email' => ['required', 'email', 'max:160'],
            'phone' => ['nullable', 'string', 'max:32'],
            'job_title' => ['nullable', 'string', 'max:80'],
            'department' => ['nullable', 'string', 'max:80'],
            'hired_at' => ['nullable', 'date'],
            'terminated_at' => ['nullable', 'date'],
            'monthly_salary' => ['nullable', 'numeric', 'min:0'],
            'currency' => ['nullable', 'string', 'size:3'],
            'emergency_contact' => ['nullable', 'array'],
            'is_active' => ['boolean'],
        ]);
    }
}
