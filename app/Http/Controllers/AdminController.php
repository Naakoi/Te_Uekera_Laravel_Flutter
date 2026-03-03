<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Models\User;
use App\Models\Subscription;
use App\Models\Purchase;
use App\Models\SubscriptionPlan;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Stevebauman\Location\Facades\Location;

class AdminController extends Controller
{
    public function dashboard()
    {
        $now = now();
        $thirtyDaysAgo = now()->subDays(30);

        // Active Subscribers
        $activeSubscribersCount = Subscription::where('status', 'active')
            ->where('ends_at', '>', $now)
            ->distinct('user_id')
            ->count();
            
        // Revenue Calculation
        $totalRevenue = DB::table('subscriptions')
            ->join('subscription_plans', 'subscriptions.subscription_plan_id', '=', 'subscription_plans.id')
            ->sum('subscription_plans.price')
            + Purchase::sum('amount');

        $monthlyRevenue = DB::table('subscriptions')
            ->join('subscription_plans', 'subscriptions.subscription_plan_id', '=', 'subscription_plans.id')
            ->where('subscriptions.created_at', '>=', $thirtyDaysAgo)
            ->sum('subscription_plans.price')
            + Purchase::where('created_at', '>=', $thirtyDaysAgo)->sum('amount');

        // Geolocated reader location stats (last 48h)
        $heatmap = collect([]);
        if (config('session.driver') === 'database') {
            $heatmap = DB::table('sessions')
                ->whereNotNull('user_id')
                ->where('last_activity', '>=', now()->subHours(48)->getTimestamp())
                ->get()
                ->map(function ($session) {
                    return cache()->remember('ip_location_' . $session->ip_address, now()->addDay(), function () use ($session) {
                        try {
                            if ($session->ip_address === '127.0.0.1' || $session->ip_address === '::1') return 'Local Dev';
                            $info = Location::get($session->ip_address);
                            return ($info && $info->cityName && $info->countryName) ? $info->cityName . ', ' . $info->countryName : 'Unknown';
                        } catch (\Exception $e) { return 'Unknown'; }
                    });
                })
                ->groupBy(fn($x) => $x)
                ->map(fn($group, $key) => ['location' => $key, 'count' => $group->count()])
                ->values()
                ->sortByDesc('count')
                ->take(6);
        }

        // Registered Readers List with Status & Country
        $readers = User::where('role', 'client')->get()->map(function ($reader) {
            $latestSession = DB::table('sessions')
                ->where('user_id', $reader->id)
                ->orderBy('last_activity', 'desc')
                ->first();

            $online = false;
            $country = 'Unknown';

            if ($latestSession) {
                // Consider online if active in last 5 minutes
                $online = ($latestSession->last_activity + 300) >= now()->getTimestamp();
                $country = cache()->remember('ip_country_' . $latestSession->ip_address, now()->addDay(), function () use ($latestSession) {
                    try {
                        if ($latestSession->ip_address === '127.0.0.1' || $latestSession->ip_address === '::1') return 'Local';
                        $info = Location::get($latestSession->ip_address);
                        return $info ? ($info->countryName ?: 'Unknown') : 'Unknown';
                    } catch (\Exception $e) { return 'Unknown'; }
                });
            } else {
                // Check mobile tokens if no web session
                $lastToken = $reader->tokens()->orderBy('last_used_at', 'desc')->first();
                if ($lastToken && $lastToken->last_used_at) {
                    $online = $lastToken->last_used_at->addMinutes(15)->isFuture();
                }
            }

            return [
                'id' => $reader->id,
                'name' => $reader->name,
                'email' => $reader->email,
                'online' => $online,
                'recent_country' => $country,
                'last_active' => $latestSession ? Carbon::createFromTimestamp($latestSession->last_activity)->diffForHumans() : 'Never',
            ];
        });

        return Inertia::render('Admin/Dashboard', [
            'staff' => User::where('role', 'staff')->get(),
            'readers' => $readers,
            'stats' => [
                'active_subscribers' => $activeSubscribersCount,
                'total_revenue' => round($totalRevenue, 2),
                'monthly_revenue' => round($monthlyRevenue, 2),
                'total_users' => User::where('role', 'client')->count(),
            ],
            'heatmap' => $heatmap,
            'recent_activity' => Purchase::with(['user', 'document'])->latest()->take(5)->get(),
        ]);
    }

    public function createStaff(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8',
            'can_upload_documents' => 'required|boolean',
            'can_create_vouchers' => 'required|boolean',
            'can_manage_users' => 'required|boolean',
        ]);

        User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => 'staff',
            'can_upload_documents' => $request->can_upload_documents,
            'can_create_vouchers' => $request->can_create_vouchers,
            'can_manage_users' => $request->can_manage_users,
        ]);

        return redirect()->back()->with('success', 'Staff created successfully.');
    }

    public function deleteStaff(User $user)
    {
        if ($user->role !== 'staff') {
            abort(403);
        }

        $user->delete();
        return redirect()->back()->with('success', 'Staff deleted successfully.');
    }

    public function togglePermission(User $user, $permission)
    {
        if ($user->role !== 'staff') {
            abort(403);
        }

        if (!in_array($permission, ['can_upload_documents', 'can_create_vouchers', 'can_manage_users'])) {
            abort(400);
        }

        $user->update([
            $permission => !$user->$permission
        ]);

        return redirect()->back()->with('success', 'Permissions updated.');
    }

    public function updateStaff(Request $request, User $user)
    {
        if ($user->role !== 'staff') {
            abort(403);
        }

        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email,' . $user->id,
            'password' => 'nullable|string|min:8',
            'can_upload_documents' => 'required|boolean',
            'can_create_vouchers' => 'required|boolean',
            'can_manage_users' => 'required|boolean',
        ]);

        $updateData = [
            'name' => $request->name,
            'email' => $request->email,
            'can_upload_documents' => $request->can_upload_documents,
            'can_create_vouchers' => $request->can_create_vouchers,
            'can_manage_users' => $request->can_manage_users,
        ];

        if ($request->filled('password')) {
            $updateData['password'] = Hash::make($request->password);
        }

        $user->update($updateData);

        return redirect()->back()->with('success', 'Staff updated successfully.');
    }
}
