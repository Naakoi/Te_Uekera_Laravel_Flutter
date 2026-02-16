<?php

namespace App\Http\Controllers;

use App\Models\SubscriptionPlan;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SubscriptionController extends Controller
{
    public function index()
    {
        return Inertia::render('Subscription/Index', [
            'plans' => SubscriptionPlan::where('is_active', true)->get(),
            'currentSubscription' => auth()->user()->subscriptions()->where('status', 'active')->where('ends_at', '>', now())->first(),
        ]);
    }
}
