<?php

class CurrencyController {
    private static array $currencies = [
        'ZAR' => ['name' => 'South African Rand', 'symbol' => 'R'],
        'USD' => ['name' => 'US Dollar', 'symbol' => '$'],
        'EUR' => ['name' => 'Euro', 'symbol' => '€'],
        'GBP' => ['name' => 'British Pound', 'symbol' => '£'],
        'AUD' => ['name' => 'Australian Dollar', 'symbol' => 'A$'],
        'CAD' => ['name' => 'Canadian Dollar', 'symbol' => 'C$'],
        'INR' => ['name' => 'Indian Rupee', 'symbol' => '₹'],
        'NGN' => ['name' => 'Nigerian Naira', 'symbol' => '₦'],
        'KES' => ['name' => 'Kenyan Shilling', 'symbol' => 'KSh'],
        'BWP' => ['name' => 'Botswana Pula', 'symbol' => 'P'],
        'NAD' => ['name' => 'Namibian Dollar', 'symbol' => 'N$'],
    ];
    
    public function index(): void {
        $currencies = [];
        foreach (self::$currencies as $code => $data) {
            $currencies[] = [
                'code' => $code,
                'name' => $data['name'],
                'symbol' => $data['symbol'],
            ];
        }
        
        Response::json(['currencies' => $currencies]);
    }
    
    public function rates(): void {
        $db = Database::getConnection();
        
        // Get base currency from query (default ZAR)
        $request = new Request();
        $baseCurrency = $request->query('base') ?? 'ZAR';
        
        $stmt = $db->prepare("
            SELECT target_currency, rate, updated_at 
            FROM exchange_rates 
            WHERE base_currency = ?
        ");
        $stmt->execute([$baseCurrency]);
        $rates = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $formattedRates = [];
        foreach ($rates as $rate) {
            $formattedRates[$rate['target_currency']] = [
                'rate' => (float) $rate['rate'],
                'updatedAt' => $rate['updated_at'],
            ];
        }
        
        // Add self-rate
        $formattedRates[$baseCurrency] = [
            'rate' => 1.0,
            'updatedAt' => date('Y-m-d H:i:s'),
        ];
        
        Response::json([
            'base' => $baseCurrency,
            'rates' => $formattedRates,
        ]);
    }
    
    public function convert(): void {
        $request = new Request();
        $data = $request->validate([
            'amount' => 'required|numeric',
            'from' => 'required|max:3',
            'to' => 'required|max:3',
        ]);
        
        $amount = (float) $data['amount'];
        $from = strtoupper($data['from']);
        $to = strtoupper($data['to']);
        
        if ($from === $to) {
            Response::json([
                'original_amount' => $amount,
                'original_currency' => $from,
                'converted_amount' => $amount,
                'target_currency' => $to,
                'rate' => 1.0,
            ]);
            return;
        }
        
        $db = Database::getConnection();
        
        // Try direct conversion
        $stmt = $db->prepare("
            SELECT rate FROM exchange_rates 
            WHERE base_currency = ? AND target_currency = ?
        ");
        $stmt->execute([$from, $to]);
        $result = $stmt->fetch();
        
        if ($result) {
            $rate = (float) $result['rate'];
        } else {
            // Try reverse conversion
            $stmt->execute([$to, $from]);
            $result = $stmt->fetch();
            
            if ($result) {
                $rate = 1 / (float) $result['rate'];
            } else {
                // Convert via ZAR as intermediate
                $stmt->execute([$from, 'ZAR']);
                $fromToZar = $stmt->fetch();
                
                $stmt->execute(['ZAR', $to]);
                $zarToTarget = $stmt->fetch();
                
                if ($fromToZar && $zarToTarget) {
                    $rate = (float) $fromToZar['rate'] * (float) $zarToTarget['rate'];
                } else {
                    Response::error("Exchange rate not available for {$from} to {$to}", 422);
                    return;
                }
            }
        }
        
        $convertedAmount = round($amount * $rate, 2);
        
        Response::json([
            'original_amount' => $amount,
            'original_currency' => $from,
            'converted_amount' => $convertedAmount,
            'target_currency' => $to,
            'rate' => round($rate, 6),
        ]);
    }
    
    public function updateRates(): void {
        // This endpoint can be called by a cron job to update rates
        // For now, we'll use static rates; in production, integrate with an API like exchangerate-api.com
        
        $db = Database::getConnection();
        
        // Placeholder rates (in production, fetch from external API)
        $rates = [
            ['ZAR', 'USD', 0.055],
            ['ZAR', 'EUR', 0.050],
            ['ZAR', 'GBP', 0.043],
            ['ZAR', 'AUD', 0.084],
            ['ZAR', 'CAD', 0.074],
            ['USD', 'ZAR', 18.18],
            ['EUR', 'ZAR', 20.00],
            ['GBP', 'ZAR', 23.26],
        ];
        
        $stmt = $db->prepare("
            INSERT INTO exchange_rates (base_currency, target_currency, rate, updated_at) 
            VALUES (?, ?, ?, NOW())
            ON DUPLICATE KEY UPDATE rate = VALUES(rate), updated_at = NOW()
        ");
        
        foreach ($rates as $rate) {
            $stmt->execute($rate);
        }
        
        Response::json(['message' => 'Exchange rates updated', 'count' => count($rates)]);
    }
}
