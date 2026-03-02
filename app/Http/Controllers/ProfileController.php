<?php

namespace App\Http\Controllers;

use App\Http\Requests\ProfileUpdateRequest;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;
use Stevebauman\Location\Facades\Location;

class ProfileController extends Controller
{
    /**
     * Display the user's profile form.
     */
    public function edit(Request $request): Response
    {
        $user = $request->user();

        $sessions = collect([]);
        if (config('session.driver') === 'database') {
            $sessions = DB::table('sessions')
                ->where('user_id', $user->id)
                ->orderBy('last_activity', 'desc')
                ->get()
                ->map(function ($session) use ($request) {
                    $location = cache()->remember('ip_location_' . $session->ip_address, now()->addDay(), function () use ($session) {
                        try {
                            if ($session->ip_address === '127.0.0.1' || $session->ip_address === '::1') {
                                return 'Local Dev Device';
                            }
                            
                            $info = Location::get($session->ip_address);
                            if ($info && $info->cityName && $info->countryName) {
                                return $info->cityName . ', ' . $info->countryName;
                            }
                            return 'Unknown Location';
                        } catch (\Exception $e) {
                            return 'Unknown';
                        }
                    });

                    return (object) [
                        'id' => $session->id,
                        'ip_address' => $session->ip_address,
                        'location' => $location,
                        'is_current_device' => $session->id === $request->session()->getId(),
                        'agent' => $session->user_agent,
                        'last_active' => Carbon::createFromTimestamp($session->last_activity)->diffForHumans(),
                    ];
                });
        }

        $tokens = $user->tokens->map(function ($token) {
            return (object) [
                'id' => $token->id,
                'name' => $token->name,
                'last_used_at' => $token->last_used_at ? $token->last_used_at->diffForHumans() : 'Never',
                'is_mobile' => true,
            ];
        });

        return Inertia::render('Profile/Edit', [
            'mustVerifyEmail' => $user instanceof MustVerifyEmail,
            'sessions' => $sessions,
            'tokens' => $tokens,
            'status' => session('status'),
        ]);
    }

    /**
     * Update the user's profile information.
     */
    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        $request->user()->fill($request->validated());

        if ($request->user()->isDirty('email')) {
            $request->user()->email_verified_at = null;
        }

        $request->user()->save();

        return Redirect::route('profile.edit');
    }

    /**
     * Delete the user's account.
     */
    public function destroy(Request $request): RedirectResponse
    {
        $request->validate([
            'password' => ['required', 'current_password'],
        ]);

        $user = $request->user();

        Auth::logout();

        $user->delete();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return Redirect::to('/');
    }

    /**
     * Terminate sessions on other devices.
     */
    public function logoutOthers(Request $request): RedirectResponse
    {
        $user = $request->user();

        try {
            // Delete all Sanctum tokens (Mobile app sessions)
            $user->tokens()->delete();

            // Delete all other web sessions (Browser sessions)
            if (config('session.driver') === 'database') {
                DB::table('sessions')
                    ->where('user_id', $user->id)
                    ->where('id', '!=', $request->session()->getId())
                    ->delete();
            }
            
            return Redirect::route('profile.edit')->with('status', 'device-logout-success');
        } catch (\Exception $e) {
            Log::error('Remote logout failed: ' . $e->getMessage());
            return Redirect::route('profile.edit')->withErrors(['remote_logout' => 'Could not sign out from other devices.']);
        }
    }
}
