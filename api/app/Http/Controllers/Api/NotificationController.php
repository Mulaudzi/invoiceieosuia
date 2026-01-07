<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class NotificationController extends Controller
{
    /**
     * Send SMS reminder for an invoice via LogicSMS API
     */
    public function sendSms(Request $request)
    {
        $request->validate([
            'invoice_id' => 'required|exists:invoices,id',
            'message' => 'required|string|max:500',
        ]);

        $user = $request->user();

        // Check plan: Only Pro/Business can send SMS
        if ($user->plan === 'free') {
            return response()->json([
                'success' => false,
                'message' => 'SMS feature is only available for Pro and Business plans. Please upgrade.',
            ], 403);
        }

        $invoice = Invoice::with('client')->findOrFail($request->invoice_id);

        // Verify invoice belongs to user
        if ($invoice->user_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Invoice not found.',
            ], 404);
        }

        $clientPhone = $invoice->client->phone ?? null;

        if (!$clientPhone) {
            return response()->json([
                'success' => false,
                'message' => 'Client phone number not available.',
            ], 422);
        }

        // Format phone number for SA (ensure it starts with +27 or 27)
        $formattedPhone = $this->formatPhoneNumber($clientPhone);

        try {
            // Send via LogicSMS API
            $response = Http::asForm()->post('https://www.logicsms.co.za/api/send', [
                'username' => config('services.logicsms.username'),
                'password' => config('services.logicsms.password'),
                'to' => $formattedPhone,
                'message' => $request->message,
            ]);

            if ($response->successful()) {
                $data = $response->json();
                
                return response()->json([
                    'success' => true,
                    'delivery_id' => $data['message_id'] ?? $data['id'] ?? 'sent',
                    'message' => 'SMS sent successfully.',
                ]);
            }

            return response()->json([
                'success' => false,
                'message' => 'Failed to send SMS. Please try again.',
                'error' => $response->body(),
            ], 500);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'SMS service unavailable. Please try again later.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Format phone number for South Africa
     */
    private function formatPhoneNumber(string $phone): string
    {
        // Remove spaces, dashes, and other formatting
        $phone = preg_replace('/[^0-9+]/', '', $phone);

        // If starts with 0, replace with +27
        if (str_starts_with($phone, '0')) {
            $phone = '+27' . substr($phone, 1);
        }

        // If starts with 27 but not +27, add +
        if (str_starts_with($phone, '27') && !str_starts_with($phone, '+27')) {
            $phone = '+' . $phone;
        }

        return $phone;
    }
}
