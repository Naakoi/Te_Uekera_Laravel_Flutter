<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
            'logout_others' => 'boolean'
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'message' => 'The provided credentials do not match our records.',
            ], 401);
        }

        // Check for active sessions on other devices (both API tokens and Web sessions)
        $hasOtherTokens = $user->tokens()->exists();
        $hasWebSessions = \DB::table('sessions')->where('user_id', $user->id)->exists();

        if (($hasOtherTokens || $hasWebSessions) && !$request->logout_others) {
            return response()->json([
                'message' => 'Your account is already logged in on another device (Mobile or Web). Do you want to sign out from all other devices before logging in here?',
                'requires_logout_others' => true
            ], 403);
        }

        if ($request->logout_others) {
            // Force logout from all other devices by deleting all tokens and web sessions
            $user->tokens()->delete();
            \DB::table('sessions')->where('user_id', $user->id)->delete();
        }

        $token = $user->createToken('mobile-app')->plainTextToken;

        return response()->json([
            'message' => 'Login successful',
            'user' => $user,
            'token' => $token,
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Logged out successfully',
        ]);
    }

    public function logoutOthers(Request $request)
    {
        $user = $request->user();
        $currentTokenId = $user->currentAccessToken()->id;

        // Delete all tokens except the current one
        $user->tokens()->where('id', '!=', $currentTokenId)->delete();

        // Delete all web sessions for this user
        \DB::table('sessions')->where('user_id', $user->id)->delete();

        return response()->json([
            'message' => 'Other devices and sessions signed out successfully',
        ]);
    }
}
