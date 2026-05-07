<?php

namespace App\Http\Controllers\HotelAdmin;

use App\Http\Controllers\Controller;
use App\Models\Tenant\Customer;
use Illuminate\Http\Request;

class CustomerController extends Controller
{
    public function index(Request $request)
    {
        $query = Customer::query();

        if ($hotelId = $request->query('hotel_id')) {
            $query->where('hotel_id', $hotelId);
        }
        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        return $query->latest()->paginate($request->integer('per_page', 25));
    }

    public function show(Customer $customer)
    {
        return $customer->load(['bookings' => fn ($q) => $q->latest()->limit(20)]);
    }

    public function store(Request $request)
    {
        return Customer::create($this->validateData($request));
    }

    public function update(Request $request, Customer $customer)
    {
        $customer->update($this->validateData($request, $customer));

        return $customer->fresh();
    }

    public function destroy(Customer $customer)
    {
        $customer->delete();

        return response()->json(['message' => 'Customer deleted.']);
    }

    private function validateData(Request $request, ?Customer $existing = null): array
    {
        return $request->validate([
            'hotel_id' => ['required', 'integer', 'exists:hotels,id'],
            'first_name' => ['required', 'string', 'max:80'],
            'last_name' => ['nullable', 'string', 'max:80'],
            'email' => ['nullable', 'email', 'max:160'],
            'phone' => ['nullable', 'string', 'max:32'],
            'date_of_birth' => ['nullable', 'date', 'before:today'],
            'gender' => ['nullable', 'in:MALE,FEMALE,OTHER,UNDISCLOSED'],
            'nationality' => ['nullable', 'string', 'size:2'],
            'address_line1' => ['nullable', 'string', 'max:160'],
            'city' => ['nullable', 'string', 'max:80'],
            'state' => ['nullable', 'string', 'max:80'],
            'country' => ['nullable', 'string', 'size:2'],
            'postal_code' => ['nullable', 'string', 'max:20'],
            'id_type' => ['nullable', 'in:PASSPORT,DRIVING_LICENSE,NATIONAL_ID,OTHER'],
            'id_number' => ['nullable', 'string', 'max:64'],
            'id_front_url' => ['nullable', 'url'],
            'id_back_url' => ['nullable', 'url'],
            'signature_url' => ['nullable', 'url'],
            'preferences' => ['nullable', 'array'],
            'notes' => ['nullable', 'string'],
        ]);
    }
}
