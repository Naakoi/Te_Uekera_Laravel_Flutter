<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;

class AdminController extends Controller
{
    public function dashboard()
    {
        return Inertia::render('Admin/Dashboard', [
            'staff' => User::where('role', 'staff')->get(),
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
