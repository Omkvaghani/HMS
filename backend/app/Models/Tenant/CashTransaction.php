<?php

namespace App\Models\Tenant;

use Illuminate\Database\Eloquent\Model;

class CashTransaction extends Model
{
    public const DIRECTION_IN = 'IN';

    public const DIRECTION_OUT = 'OUT';

    protected $fillable = [
        'hotel_id', 'transaction_date', 'direction', 'kind',
        'amount', 'currency', 'reference', 'notes',
        'booking_id', 'expense_id', 'recorded_by',
    ];

    protected $casts = [
        'transaction_date' => 'date',
        'amount' => 'decimal:2',
    ];

    public function hotel()
    {
        return $this->belongsTo(Hotel::class);
    }

    public function booking()
    {
        return $this->belongsTo(Booking::class);
    }

    public function expense()
    {
        return $this->belongsTo(Expense::class);
    }
}
