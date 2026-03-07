<?php

namespace App\Http\Controllers;

use App\Models\PaymentGatewaySetting;
use App\Models\Subscription;
use App\Models\SubscriptionPlan;
use App\Models\Document;
use App\Models\Purchase;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Stripe\Stripe;
use Stripe\Checkout\Session;

class StripeController extends Controller
{
    public function checkout(Request $request)
    {
        $request->validate([
            'plan_id' => 'nullable|exists:subscription_plans,id',
            'document_id' => 'nullable|exists:documents,id',
        ]);

        if (!$request->plan_id && !$request->document_id) {
            abort(422, 'Either plan_id or document_id is required');
        }

        $setting = PaymentGatewaySetting::where('gateway', 'stripe')->where('is_enabled', true)->firstOrFail();
        $config = (array) $setting->config;
        \Stripe\Stripe::setApiKey($config['secret_key']);

        $lineItems = [];
        $metaData = [];
        $successUrl = route('stripe.success') . '?session_id={CHECKOUT_SESSION_ID}';
        $cancelUrl = $request->plan_id ? route('subscription.index') : route('documents.show', $request->document_id);

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
                    'product_data' => ['name' => "Edition: " . $document->title],
                    'unit_amount' => $document->price * 100,
                ],
                'quantity' => 1,
            ];
            $metaData['document_id'] = $document->id;
        }

        $session = Session::create([
            'payment_method_types' => ['card'],
            'line_items' => $lineItems,
            'metadata' => $metaData,
            'mode' => 'payment',
            'success_url' => $successUrl,
            'cancel_url' => $cancelUrl,
        ]);

        return response()->json(['url' => $session->url]);
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

        // Get the authenticated user — required to record the purchase later
        $user = auth('sanctum')->user() ?? auth()->user();
        if (!$user) {
            $token = $request->bearerToken() ?? $request->get('token');
            if ($token) {
                $accessToken = \Laravel\Sanctum\PersonalAccessToken::findToken($token);
                if ($accessToken && $accessToken->tokenable) {
                    $user = $accessToken->tokenable;
                }
            }
        }

        if (!$user) {
            Log::warning('apiCheckout: No authenticated user found.');
            return response()->json(['error' => 'Unauthenticated. Please log in.'], 401);
        }

        $setting = PaymentGatewaySetting::where('gateway', 'stripe')->where('is_enabled', true)->firstOrFail();
        $config = (array) $setting->config;
        Stripe::setApiKey($config['secret_key']);

        $lineItems = [];
        $metaData = [
            // CRITICAL: store user_id so we can record the purchase after Stripe redirect
            'user_id' => $user->id,
        ];
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

        Log::info("apiCheckout: User {$user->id} ({$user->email}) initiating Stripe checkout.", ['meta' => $metaData]);

        $session = Session::create([
            'payment_method_types' => ['card'],
            'line_items' => $lineItems,
            'mode' => $mode,
            'metadata' => $metaData,
            'success_url' => route('api.stripe.success') . '?session_id={CHECKOUT_SESSION_ID}',
            'cancel_url' => route('documents.index'),
        ]);

        return response()->json(['url' => $session->url]);
    }

    public function apiSuccess(Request $request)
    {
        $sessionId = $request->get('session_id');
        if (!$sessionId) {
            return "<html><body><h1>Error: No session ID provided.</h1></body></html>";
        }

        $setting = PaymentGatewaySetting::where('gateway', 'stripe')->where('is_enabled', true)->firstOrFail();
        $config = (array) $setting->config;
        Stripe::setApiKey($config['secret_key']);

        $session = Session::retrieve($sessionId);

        if ($session->payment_status === 'paid') {
            $planId = $session->metadata->plan_id ?? null;
            $documentId = $session->metadata->document_id ?? null;

            // CRITICAL FIX: Get user_id from Stripe metadata (not from auth session,
            // which is unavailable on this public callback URL)
            $userId = $session->metadata->user_id ?? null;

            Log::info("apiSuccess: Stripe payment confirmed. Session: $sessionId", [
                'user_id' => $userId,
                'document_id' => $documentId,
                'plan_id' => $planId,
            ]);

            if (!$userId) {
                Log::error("apiSuccess: user_id missing from Stripe metadata! Cannot record purchase.");
                return "<html><body><h1>Payment Received</h1><p>Your payment was received but account linking failed. Please contact support with reference: $sessionId</p></body></html>";
            }

            $user = User::find($userId);
            if (!$user) {
                Log::error("apiSuccess: User $userId not found in database!");
                return "<html><body><h1>Payment Received</h1><p>Your payment was received but account linking failed. Please contact support with reference: $sessionId</p></body></html>";
            }

            if ($planId) {
                $plan = SubscriptionPlan::findOrFail($planId);
                Subscription::create([
                    'user_id' => $user->id,
                    'subscription_plan_id' => $plan->id,
                    'starts_at' => now(),
                    'ends_at' => now()->addDays($plan->duration_days),
                    'payment_method' => 'stripe',
                    'payment_id' => $session->id,
                    'status' => 'active',
                ]);
                Log::info("apiSuccess: Subscription created for user {$user->id}");
            } elseif ($documentId) {
                $document = Document::findOrFail($documentId);
                $purchase = Purchase::firstOrCreate(
                    [
                        'user_id' => $user->id,
                        'document_id' => $document->id,
                    ],
                    [
                        'amount' => $document->price,
                        'payment_method' => 'stripe',
                        'payment_id' => $session->id,
                        'status' => 'completed',
                    ]
                );
                Log::info("apiSuccess: Purchase {'created': {$purchase->wasRecentlyCreated}} for user {$user->id}, doc {$document->id}");
            }

            return "<html><body style='font-family:sans-serif;text-align:center;padding:40px'><h1 style='color:green'>&#10003; Payment Successful!</h1><p>Your edition has been unlocked. Please return to the app and refresh.</p><p style='color:gray;font-size:12px'>This window will close automatically.</p><script>setTimeout(() => { window.close(); }, 4000);</script></body></html>";
        }

        Log::warning("apiSuccess: Payment NOT confirmed. Status: {$session->payment_status}");
        return "<html><body><h1>Payment Not Confirmed</h1><p>Status: {$session->payment_status}. Please try again.</p></body></html>";
    }

    public function success(Request $request)
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
                return redirect()->route('subscription.index')->with('success', 'Subscription activated!');
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
                return redirect()->route('documents.reader', $document->id)->with('success', 'Edition unlocked!');
            }
        }

        return redirect()->route('documents.index')->with('error', 'Payment failed.');
    }
}
