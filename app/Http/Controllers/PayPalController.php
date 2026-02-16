<?php

namespace App\Http\Controllers;

use App\Models\PaymentGatewaySetting;
use App\Models\Subscription;
use App\Models\SubscriptionPlan;
use Illuminate\Http\Request;
use Srmklive\PayPal\Services\PayPal as PayPalClient;

class PayPalController extends Controller
{
    private function getPaypalClient()
    {
        $setting = PaymentGatewaySetting::where('gateway', 'paypal')->where('is_enabled', true)->firstOrFail();

        $configData = (array) $setting->config;

        $config = [
            'mode' => $configData['mode'],
            'sandbox' => [
                'client_id' => $configData['client_id'],
                'client_secret' => $configData['client_secret'],
                'app_id' => $configData['app_id'],
            ],
            'live' => [
                'client_id' => $configData['client_id'],
                'client_secret' => $configData['client_secret'],
                'app_id' => $configData['app_id'],
            ],
            'payment_action' => 'Sale',
            'currency' => 'USD',
            'notify_url' => '',
            'locale' => 'en_US',
            'validate_ssl' => true,
        ];

        $provider = new PayPalClient;
        $provider->setApiCredentials($config);
        $provider->getAccessToken();

        return $provider;
    }

    public function checkout(Request $request)
    {
        $request->validate([
            'plan_id' => 'required|exists:subscription_plans,id',
        ]);

        $plan = SubscriptionPlan::findOrFail($request->plan_id);
        $provider = $this->getPaypalClient();

        $response = $provider->createOrder([
            "intent" => "CAPTURE",
            "purchase_units" => [
                [
                    "amount" => [
                        "currency_code" => "USD",
                        "value" => $plan->price
                    ],
                    "description" => $plan->name
                ]
            ],
            "application_context" => [
                "cancel_url" => route('subscription.index'),
                "return_url" => route('paypal.success', ['plan_id' => $plan->id])
            ]
        ]);

        if (isset($response['id']) && $response['status'] == 'CREATED') {
            foreach ($response['links'] as $links) {
                if ($links['rel'] == 'approve') {
                    return redirect()->away($links['href']);
                }
            }
        }

        return redirect()->route('subscription.index')->with('error', 'Something went wrong with PayPal.');
    }

    public function success(Request $request)
    {
        $planId = $request->get('plan_id');
        $plan = SubscriptionPlan::findOrFail($planId);

        $provider = $this->getPaypalClient();
        $response = $provider->capturePaymentOrder($request->token);

        if (isset($response['status']) && $response['status'] == 'COMPLETED') {
            Subscription::create([
                'user_id' => auth()->id(),
                'subscription_plan_id' => $plan->id,
                'starts_at' => now(),
                'ends_at' => now()->addDays($plan->duration_days),
                'payment_method' => 'paypal',
                'payment_id' => $response['id'],
                'status' => 'active',
            ]);

            return redirect()->route('subscription.index')->with('success', 'Subscription activated!');
        }

        return redirect()->route('subscription.index')->with('error', 'Payment failed.');
    }
}
