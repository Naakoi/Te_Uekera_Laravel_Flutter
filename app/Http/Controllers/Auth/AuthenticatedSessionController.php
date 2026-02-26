<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Providers\RouteServiceProvider;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Inertia\Response;

class AuthenticatedSessionController extends Controller
{
    /**
     * Display the login view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/Login', [
            'canResetPassword' => Route::has('password.request'),
            'status' => session('status'),
        ]);
    }

    /**
     * Handle an incoming authentication request.
     */
    public function store(LoginRequest $request): RedirectResponse
    {
        $request->authenticate();

        $user = Auth::user();

        try {
            // Check for other active sessions (Tokens or DB sessions)
            // Wrapped in try/catch to handle environments where sessions table 
            // may not yet exist (e.g., before running migrations on production).
            $hasOtherTokens = $user->tokens()->exists();

            $hasOtherWebSessions = false;
            if (config('session.driver') === 'database') {
                $hasOtherWebSessions = \DB::table('sessions')
                    ->where('user_id', $user->id)
                    ->where('id', '!=', $request->session()->getId())
                    ->exists();
            }

            if (($hasOtherTokens || $hasOtherWebSessions) && !$request->boolean('logout_others')) {
                Auth::guard('web')->logout();

                return back()->withErrors([
                    'email' => 'Your account is already logged in on another device. Please sign out from other devices first.',
                    'requires_logout_others' => true,
                ]);
            }

            if ($request->boolean('logout_others')) {
                $user->tokens()->delete();
                if (config('session.driver') === 'database') {
                    \DB::table('sessions')
                        ->where('user_id', $user->id)
                        ->where('id', '!=', $request->session()->getId())
                        ->delete();
                }
            }
        } catch (\Exception $e) {
            // If multi-device check fails (e.g., missing sessions table),
            // log the warning and allow login to proceed normally.
            \Log::warning('Multi-device session check failed: ' . $e->getMessage());
        }

        $request->session()->regenerate();

        return redirect()->intended(RouteServiceProvider::HOME);
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): RedirectResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();

        $request->session()->regenerateToken();

        return redirect('/');
    }
}
