<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\PaymentGatewaySetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;

class GatewaySettingController extends Controller
{
    public function index()
    {
        try {
            Log::info('GatewaySettingController@index hit');
            
            // Explicitly check for table existence to handle edge cases
            if (!Schema::hasTable('payment_gateway_settings')) {
                Log::error('Payment gateway settings table is missing!');
                return redirect()->route('admin.dashboard')->with('error', 'System Error: Payment configuration table is missing. Please run migrations.');
            }

            $settings = PaymentGatewaySetting::all();
            $settingsGrouped = $settings->keyBy('gateway');
            Log::info('Settings fetched', ['count' => $settings->count()]);

            // Ensure stripe and paypal records exist if missing
            if (!$settingsGrouped->has('stripe')) {
                Log::info('Creating missing stripe setting record');
                PaymentGatewaySetting::create([
                    'gateway' => 'stripe',
                    'config' => ['public_key' => '', 'secret_key' => '', 'webhook_secret' => ''],
                    'is_enabled' => false,
                ]);
            }

            if (!$settingsGrouped->has('paypal')) {
                Log::info('Creating missing paypal setting record');
                PaymentGatewaySetting::create([
                    'gateway' => 'paypal',
                    'config' => ['client_id' => '', 'client_secret' => '', 'app_id' => '', 'mode' => 'sandbox'],
                    'is_enabled' => false,
                ]);
            }

            // Refresh to get the created records
            Log::info('Rendering Admin/GatewaySettings/Index');
            return Inertia::render('Admin/GatewaySettings/Index', [
                'settings' => PaymentGatewaySetting::all(),
            ]);
        } catch (\Exception $e) {
            Log::error('GatewaySettings Index Error: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);
            return redirect()->route('admin.dashboard')->with('error', 'Failed to load Payment Gateways: ' . $e->getMessage());
        }
    }

    public function update(Request $request)
    {
        $request->validate([
            'gateway' => 'required|string|in:stripe,paypal',
            'config' => 'required|array',
            'is_enabled' => 'required|boolean',
        ]);

        $setting = PaymentGatewaySetting::where('gateway', $request->gateway)->firstOrFail();

        $setting->update([
            'config' => $request->config,
            'is_enabled' => $request->is_enabled,
        ]);

        return redirect()->back()->with('success', ucfirst($request->gateway) . ' settings updated successfully.');
    }

    public function testGateway(Request $request)
    {
        $request->validate([
            'gateway' => 'required|string|in:stripe,paypal',
            'config' => 'required|array',
        ]);

        $gateway = $request->gateway;
        $config = $request->config;

        try {
            if ($gateway === 'stripe') {
                if (empty($config['secret_key'])) {
                    return response()->json(['success' => false, 'message' => 'Secret key is required for testing.']);
                }
                \Stripe\Stripe::setApiKey($config['secret_key']);
                \Stripe\Account::retrieve();
                return response()->json(['success' => true, 'message' => 'Stripe connection successful!']);
            } elseif ($gateway === 'paypal') {
                if (empty($config['client_id']) || empty($config['client_secret'])) {
                    return response()->json(['success' => false, 'message' => 'Client ID and Secret are required for testing.']);
                }
                
                $paypalConfig = [
                    'mode' => $config['mode'] ?? 'sandbox',
                    'sandbox' => [
                        'client_id' => $config['client_id'],
                        'client_secret' => $config['client_secret'],
                        'app_id' => $config['app_id'] ?? '',
                    ],
                    'live' => [
                        'client_id' => $config['client_id'],
                        'client_secret' => $config['client_secret'],
                        'app_id' => $config['app_id'] ?? '',
                    ],
                    'payment_action' => 'Sale',
                    'currency' => 'USD',
                    'notify_url' => '',
                    'locale' => 'en_US',
                    'validate_ssl' => true,
                ];

                $provider = new \Srmklive\PayPal\Services\PayPal;
                $provider->setApiCredentials($paypalConfig);
                $provider->getAccessToken();
                
                return response()->json(['success' => true, 'message' => 'PayPal connection successful!']);
            }
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Connection failed: ' . $e->getMessage()]);
        }

        return response()->json(['success' => false, 'message' => 'Invalid gateway.']);
    }
}
