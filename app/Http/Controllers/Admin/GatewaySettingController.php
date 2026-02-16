<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\PaymentGatewaySetting;
use Illuminate\Http\Request;
use Inertia\Inertia;

class GatewaySettingController extends Controller
{
    public function index()
    {
        $settings = PaymentGatewaySetting::all()->keyBy('gateway');

        // Ensure stripe and paypal records exist
        if (!$settings->has('stripe')) {
            PaymentGatewaySetting::create([
                'gateway' => 'stripe',
                'config' => ['public_key' => '', 'secret_key' => '', 'webhook_secret' => ''],
                'is_enabled' => false,
            ]);
        }

        if (!$settings->has('paypal')) {
            PaymentGatewaySetting::create([
                'gateway' => 'paypal',
                'config' => ['client_id' => '', 'client_secret' => '', 'app_id' => '', 'mode' => 'sandbox'],
                'is_enabled' => false,
            ]);
        }

        return Inertia::render('Admin/GatewaySettings/Index', [
            'settings' => PaymentGatewaySetting::all(),
        ]);
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
}
