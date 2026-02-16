<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Models\Document;
use App\Models\Purchase;
use App\Models\PaymentCode;
use Illuminate\Support\Facades\DB;

class PaymentController extends Controller
{
    public function simulatePayment(Request $request, Document $document)
    {
        // Check if already purchased
        if (auth()->user()->purchases()->where('document_id', $document->id)->exists()) {
            return redirect()->back()->with('info', 'You already own this document.');
        }

        Purchase::create([
            'user_id' => auth()->id(),
            'document_id' => $document->id,
            'amount' => 1.00,
            'payment_method' => 'simulated',
            'status' => 'completed',
        ]);

        return redirect()->route('documents.show', $document)->with('success', 'Payment successful!');
    }

    public function redeemCode(Request $request)
    {
        $request->validate([
            'code' => 'required|string|exists:payment_codes,code',
            'document_id' => 'required|exists:documents,id',
        ]);

        $paymentCode = PaymentCode::where('code', $request->code)
            ->where('is_used', false)
            ->first();

        if (!$paymentCode) {
            return redirect()->back()->withErrors(['code' => 'Invalid or already used code.']);
        }

        // If the code is restricted to a specific document, check it
        if ($paymentCode->document_id && $paymentCode->document_id != $request->document_id) {
            return redirect()->back()->withErrors(['code' => 'This code is not valid for this document.']);
        }

        $document = Document::findOrFail($request->document_id);

        DB::transaction(function () use ($paymentCode, $document) {
            $paymentCode->update([
                'is_used' => true,
                'used_by' => auth()->id(),
            ]);

            Purchase::create([
                'user_id' => auth()->id(),
                'document_id' => $document->id,
                'amount' => $document->price,
                'payment_method' => 'code',
                'payment_code_id' => $paymentCode->id,
                'status' => 'completed',
            ]);
        });

        return redirect()->route('documents.show', $document)->with('success', 'Code redeemed successfully!');
    }
}
