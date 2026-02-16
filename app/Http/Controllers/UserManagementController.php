<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;

class UserManagementController extends Controller
{
    /**
     * Display a listing of client users.
     */
    public function index(Request $request)
    {
        if (auth()->user()->role !== 'admin' && !auth()->user()->can_manage_users) {
            abort(403, 'Unauthorized. You do not have permission to manage users.');
        }

        $query = User::where('role', 'client');

        if ($request->has('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        return Inertia::render('Staff/UserManagement', [
            'users' => $query->latest()
                ->paginate(15)
                ->withQueryString()
                ->through(fn($user) => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'created_at' => $user->created_at->format('M d, Y'),
                ]),
            'filters' => $request->only(['search']),
        ]);
    }

    /**
     * Update the specified user's password.
     */
    public function resetPassword(Request $request, User $user)
    {
        if (auth()->user()->role !== 'admin' && !auth()->user()->can_manage_users) {
            abort(403, 'Unauthorized. You do not have permission to manage users.');
        }

        // Only allow resetting passwords for client users
        if ($user->role !== 'client') {
            abort(403, 'Unauthorized action.');
        }

        $request->validate([
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $user->update([
            'password' => Hash::make($request->password),
        ]);

        return redirect()->back()->with('success', "Password for {$user->name} has been reset successfully.");
    }
}
