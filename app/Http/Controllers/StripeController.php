<?php

namespace App\Http\Controllers;

use App\Models\PaymentGatewaySetting;
use App\Models\Subscription;
use App\Models\SubscriptionPlan;
use App\Models\Document;
use App\Models\Purchase;
use Illuminate\Http\Request;
use Stripe\Stripe;
use Stripe\Checkout\Session;

class StripeController extends Controller
{
    public function checkout(Request $request)
    {
        $request->validate([
            'plan_id' => 'required|exists:subscription_plans,id',
        ]);

        $plan = SubscriptionPlan::findOrFail($request->plan_id);
        $setting = PaymentGatewaySetting::where('gateway', 'stripe')->where('is_enabled', true)->firstOrFail();

        $config = (array) $setting->config;
        Stripe::setApiKey($config['secret_key']);

        $session = Session::create([
            'payment_method_types' => ['card'],
            'line_items' => [
                [
                    'price_data' => [
                        'currency' => 'usd',
                        'product_data' => [
                            'name' => $plan->name,
                        ],
                        'unit_amount' => $plan->price * 100,
                    ],
                    'quantity' => 1,
                ]
            ],
            'mode' => 'payment',
            'success_url' => route('stripe.success') . '?session_id={CHECKOUT_SESSION_ID}&plan_id=' . $plan->id,
            'cancel_url' => route('subscription.index'),
        ]);

        return redirect($session->url);
    }

    public function apiCheckout(Request $request)
    {
        $request->validate([
            'plan_id' => 'nullable|exists:subscription_plans,id',
            'document_id' => 'nullable|exists:documents,id',
        ]);

        if (!$request->plan_id && !$request->document_id) {
            return response()->json(['error' => 'Either plan_id or document_id is required'], 422);
        }

        $setting = PaymentGatewaySetting::where('gateway', 'stripe')->where('is_enabled', true)->firstOrFail();
        $config = (array) $setting->config;
        Stripe::setApiKey($config['secret_key']);

        $lineItems = [];
        $metaData = [];
        $mode = 'payment';

        if ($request->plan_id) {
            $plan = SubscriptionPlan::findOrFail($request->plan_id);
            $lineItems[] = [
                'price_data' => [
                    'currency' => 'usd',
                    'product_data' => ['name' => $plan->name],
                    'unit_amount' => $plan->price * 100,
                ],
                'quantity' => 1,
            ];
            $metaData['plan_id'] = $plan->id;
        } else {
            $document = Document::findOrFail($request->document_id);
            $lineItems[] = [
                'price_data' => [
                    'currency' => 'usd',
                    'product_data' => ['name' => $document->title],
                    'unit_amount' => $document->price * 100,
                ],
                'quantity' => 1,
            ];
            $metaData['document_id'] = $document->id;
        }

        $session = Session::create([
            'payment_method_types' => ['card'],
            'line_items' => $lineItems,
            'mode' => $mode,
            'metadata' => $metaData,
            'success_url' => route('api.stripe.success') . '?session_id={CHECKOUT_SESSION_ID}',
            'cancel_url' => route('documents.index'), // Fallback for cancel
        ]);

        return response()->json(['url' => $session->url]);
    }

    public function apiSuccess(Request $request)
    {
        $sessionId = $request->get('session_id');
        $setting = PaymentGatewaySetting::where('gateway', 'stripe')->where('is_enabled', true)->firstOrFail();
        $config = (array) $setting->config;
        Stripe::setApiKey($config['secret_key']);

        $session = Session::retrieve($sessionId);

        if ($session->payment_status === 'paid') {
            $planId = $session->metadata->plan_id ?? null;
            $documentId = $session->metadata->document_id ?? null;

            if ($planId) {
                $plan = SubscriptionPlan::findOrFail($planId);
                Subscription::create([
                    'user_id' => auth()->id(),
                    'subscription_plan_id' => $plan->id,
                    'starts_at' => now(),
                    'ends_at' => now()->addDays($plan->duration_days),
                    'payment_method' => 'stripe',
                    'payment_id' => $session->id,
                    'status' => 'active',
                ]);
            } elseif ($documentId) {
                $document = Document::findOrFail($documentId);
                Purchase::firstOrCreate([
                    'user_id' => auth()->id(),
                    'document_id' => $document->id,
                ], [
                    'amount' => $document->price,
                    'payment_method' => 'stripe',
                    'payment_id' => $session->id,
                    'status' => 'completed',
                ]);
            }

            // Return a simple success page or JSON if called via API redirect
            return "<html><body><h1>Payment Successful!</h1><p>You can now return to the app.</p><script>setTimeout(() => { window.close(); }, 3000);</script></body></html>";
        }

        return "<html><body><h1>Payment Failed</h1><p>Please try again.</p></body></html>";
    }

    public function success(Request $request)
    {
        // Existing web success logic...
        // (Could be unified, but keeping simple for now)
        $sessionId = $request->get('session_id');
        $planId = $request->get('plan_id');

        $plan = SubscriptionPlan::findOrFail($planId);
        $setting = PaymentGatewaySetting::where('gateway', 'stripe')->where('is_enabled', true)->firstOrFail();

        $config = (array) $setting->config;
        Stripe::setApiKey($config['secret_key']);
        $session = Session::retrieve($sessionId);

        if ($session->payment_status === 'paid') {
            Subscription::create([
                'user_id' => auth()->id(),
                'subscription_plan_id' => $plan->id,
                'starts_at' => now(),
                'ends_at' => now()->addDays($plan->duration_days),
                'payment_method' => 'stripe',
                'payment_id' => $session->id,
                'status' => 'active',
            ]);

            return redirect()->route('subscription.index')->with('success', 'Subscription activated!');
        }

        return redirect()->route('subscription.index')->with('error', 'Payment failed.');
    }
}
