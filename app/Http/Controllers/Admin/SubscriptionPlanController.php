<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SubscriptionPlan;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Str;

class SubscriptionPlanController extends Controller
{
    public function index()
    {
        return Inertia::render('Admin/SubscriptionPlans/Index', [
            'plans' => SubscriptionPlan::all(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'duration_days' => 'required|integer|min:1',
        ]);

        $validated['slug'] = Str::slug($validated['name']);

        SubscriptionPlan::create($validated);

        return redirect()->back()->with('success', 'Subscription plan created successfully.');
    }

    public function update(Request $request, SubscriptionPlan $plan)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'duration_days' => 'required|integer|min:1',
            'is_active' => 'required|boolean',
        ]);

        $validated['slug'] = Str::slug($validated['name']);

        $plan->update($validated);

        return redirect()->back()->with('success', 'Subscription plan updated successfully.');
    }

    public function destroy(SubscriptionPlan $plan)
    {
        $plan->delete();

        return redirect()->back()->with('success', 'Subscription plan deleted successfully.');
    }
}
