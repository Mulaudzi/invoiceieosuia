<?php

class Payment extends Model {
    protected static string $table = 'payments';
    protected static array $fillable = [
        'user_id', 'invoice_id', 'amount', 'method',
        'date', 'reference', 'notes', 'gateway', 'gateway_transaction_id'
    ];
}
