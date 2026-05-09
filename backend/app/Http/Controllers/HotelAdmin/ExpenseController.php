<?php

namespace App\Http\Controllers\HotelAdmin;

use App\Http\Controllers\Controller;
use App\Models\Tenant\CashTransaction;
use App\Models\Tenant\Expense;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ExpenseController extends Controller
{
    public function index(Request $request)
    {
        $query = Expense::query()->with('hotel:id,name');
        if ($hotelId = $request->query('hotel_id')) {
            $query->where('hotel_id', $hotelId);
        }
        if ($from = $request->query('from')) {
            $query->whereDate('expense_date', '>=', $from);
        }
        if ($to = $request->query('to')) {
            $query->whereDate('expense_date', '<=', $to);
        }
        if ($category = $request->query('category')) {
            $query->where('category', $category);
        }

        return $query->orderByDesc('expense_date')->paginate($request->integer('per_page', 50));
    }

    public function show(Expense $expense)
    {
        return $expense->load('hotel:id,name');
    }

    public function store(Request $request)
    {
        $data = $this->validateData($request);
        $useCash = $data['payment_method'] ?? null;
        unset($data['record_in_cash']);

        return DB::transaction(function () use ($data, $useCash, $request) {
            $expense = Expense::create($data);

            if (filter_var($request->input('record_in_cash', $useCash === 'CASH'), FILTER_VALIDATE_BOOLEAN)) {
                CashTransaction::create([
                    'hotel_id' => $expense->hotel_id,
                    'transaction_date' => $expense->expense_date,
                    'direction' => CashTransaction::DIRECTION_OUT,
                    'kind' => 'EXPENSE',
                    'amount' => $expense->amount,
                    'currency' => $expense->currency,
                    'reference' => $expense->vendor,
                    'notes' => $expense->notes,
                    'expense_id' => $expense->id,
                    'recorded_by' => optional($request->user())->id,
                ]);
            }

            return $expense->fresh();
        });
    }

    public function update(Request $request, Expense $expense)
    {
        $data = $this->validateData($request, $expense->id);
        unset($data['record_in_cash']);
        $expense->update($data);

        return $expense->fresh();
    }

    public function destroy(Expense $expense)
    {
        $expense->delete();

        return response()->json(['message' => 'Expense deleted.']);
    }

    public function summary(Request $request)
    {
        $data = $request->validate([
            'hotel_id' => ['nullable', 'integer'],
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date'],
        ]);

        $query = Expense::query();
        if (! empty($data['hotel_id'])) {
            $query->where('hotel_id', $data['hotel_id']);
        }
        if (! empty($data['from'])) {
            $query->whereDate('expense_date', '>=', $data['from']);
        }
        if (! empty($data['to'])) {
            $query->whereDate('expense_date', '<=', $data['to']);
        }

        return [
            'total' => round((float) $query->sum('amount'), 2),
            'by_category' => $query->clone()
                ->selectRaw('category, SUM(amount) as total')
                ->groupBy('category')
                ->orderByDesc('total')
                ->get(),
        ];
    }

    private function validateData(Request $request, ?int $ignoreId = null): array
    {
        return $request->validate([
            'hotel_id' => ['required', 'integer', 'exists:hotels,id'],
            'category' => ['required', 'string', 'max:80'],
            'vendor' => ['nullable', 'string', 'max:120'],
            'expense_date' => ['required', 'date'],
            'amount' => ['required', 'numeric', 'min:0'],
            'currency' => ['nullable', 'string', 'size:3'],
            'payment_method' => ['nullable', 'string', 'max:40'],
            'receipt_url' => ['nullable', 'url'],
            'notes' => ['nullable', 'string', 'max:2000'],
            'record_in_cash' => ['nullable', 'boolean'],
        ]);
    }
}
