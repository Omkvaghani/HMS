<?php

namespace App\Http\Controllers\HotelAdmin;

use App\Http\Controllers\Controller;
use App\Models\Tenant\CashTransaction;
use Illuminate\Http\Request;

class CashController extends Controller
{
    public function index(Request $request)
    {
        $query = CashTransaction::query();
        if ($hotelId = $request->query('hotel_id')) {
            $query->where('hotel_id', $hotelId);
        }
        if ($from = $request->query('from')) {
            $query->whereDate('transaction_date', '>=', $from);
        }
        if ($to = $request->query('to')) {
            $query->whereDate('transaction_date', '<=', $to);
        }
        if ($direction = $request->query('direction')) {
            $query->where('direction', strtoupper($direction));
        }
        if ($kind = $request->query('kind')) {
            $query->where('kind', strtoupper($kind));
        }

        return $query->orderByDesc('transaction_date')->orderByDesc('id')
            ->paginate($request->integer('per_page', 50));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'hotel_id' => ['required', 'integer', 'exists:hotels,id'],
            'transaction_date' => ['nullable', 'date'],
            'direction' => ['required', 'in:IN,OUT'],
            'kind' => ['required', 'in:OPENING_BALANCE,BOOKING_PAYMENT,EXPENSE,STAFF_ADVANCE,BANK_DEPOSIT,PETTY_CASH,CLOSING_BALANCE,OTHER'],
            'amount' => ['required', 'numeric', 'min:0'],
            'currency' => ['nullable', 'string', 'size:3'],
            'reference' => ['nullable', 'string', 'max:120'],
            'notes' => ['nullable', 'string', 'max:2000'],
            'booking_id' => ['nullable', 'integer'],
            'expense_id' => ['nullable', 'integer'],
        ]);
        $data['transaction_date'] ??= now()->toDateString();
        $data['recorded_by'] = optional($request->user())->id;

        return CashTransaction::create($data);
    }

    public function destroy(CashTransaction $cashTransaction)
    {
        $cashTransaction->delete();

        return response()->json(['message' => 'Entry removed.']);
    }

    public function summary(Request $request)
    {
        $data = $request->validate([
            'hotel_id' => ['nullable', 'integer'],
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date'],
        ]);

        $query = CashTransaction::query();
        if (! empty($data['hotel_id'])) {
            $query->where('hotel_id', $data['hotel_id']);
        }
        if (! empty($data['from'])) {
            $query->whereDate('transaction_date', '>=', $data['from']);
        }
        if (! empty($data['to'])) {
            $query->whereDate('transaction_date', '<=', $data['to']);
        }

        $rows = $query->clone()
            ->selectRaw('direction, SUM(amount) as total')
            ->groupBy('direction')
            ->pluck('total', 'direction');

        $cashIn = (float) ($rows['IN'] ?? 0);
        $cashOut = (float) ($rows['OUT'] ?? 0);

        return [
            'cash_in' => round($cashIn, 2),
            'cash_out' => round($cashOut, 2),
            'balance' => round($cashIn - $cashOut, 2),
            'by_kind' => $query->clone()
                ->selectRaw('kind, direction, SUM(amount) as total')
                ->groupBy('kind', 'direction')
                ->get(),
        ];
    }
}
