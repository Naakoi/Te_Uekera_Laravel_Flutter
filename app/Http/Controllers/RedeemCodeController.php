<?php

namespace App\Http\Controllers;

use App\Models\RedeemCode;
use App\Models\Document;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Carbon\Carbon;

class RedeemCodeController extends Controller
{
    public function index()
    {
        return Inertia::render('Admin/RedeemCodes', [
            'codes' => RedeemCode::with(['user', 'creator', 'document'])->latest()->paginate(20),
            'documents' => Document::all()
        ]);
    }

    public function generate(Request $request)
    {
        if (auth()->user()->role !== 'admin' && !auth()->user()->can_create_vouchers) {
            abort(403, 'Unauthorized. You do not have permission to generate vouchers.');
        }

        $request->validate([
            'count' => 'required|integer|min:1|max:100',
            'document_id' => 'nullable|exists:documents,id',
            'duration_type' => 'required|string|in:permanent,weekly,monthly',
        ]);

        for ($i = 0; $i < $request->count; $i++) {
            RedeemCode::create([
                'code' => strtoupper(Str::random(10)),
                'is_used' => false,
                'document_id' => $request->document_id,
                'duration_type' => $request->duration_type,
                'creator_id' => auth()->id(),
            ]);
        }

        return redirect()->back()->with('success', "{$request->count} codes generated.");
    }

    public function destroy(RedeemCode $code)
    {
        if (auth()->user()->role !== 'admin' && !auth()->user()->can_create_vouchers) {
            abort(403, 'Unauthorized. You do not have permission to delete vouchers.');
        }

        $code->delete();
        return redirect()->back()->with('success', "Code deleted successfully.");
    }

    public function redeem(Request $request)
    {
        // Defence-in-depth: ensure the caller is authenticated via Sanctum
        // (route is already guarded by auth:sanctum middleware, but we double-check here)
        $userId = auth('sanctum')->id();
        if (!$userId) {
            return response()->json(['message' => 'You must be logged in to redeem a code.'], 401);
        }

        $request->validate([
            'code' => 'required|string',
            'device_id' => 'required|string',
            'document_id' => 'nullable|exists:documents,id',
        ]);

        $redeemCode = RedeemCode::where('code', $request->code)->first();

        if (!$redeemCode) {
            return response()->json(['message' => 'Invalid code.'], 422);
        }

        if ($redeemCode->is_used) {
            return response()->json(['message' => 'This code has already been used.'], 422);
        }

        // If code is specifically for a document, and user is trying to redeem it for a different/no document context
        if ($redeemCode->document_id && $request->document_id && $redeemCode->document_id != $request->document_id) {
            return response()->json(['message' => 'This code is for a different document.'], 422);
        }

        $now = Carbon::now();

        // Check if this device already has an active activation for this content (not expired)
        $deviceQuery = RedeemCode::where('device_id', $request->device_id)
            ->where('is_used', true)
            ->where(function ($q) use ($now) {
                $q->whereNull('expires_at')
                    ->orWhere('expires_at', '>', $now);
            });

        if ($redeemCode->document_id) {
            $deviceQuery->where('document_id', $redeemCode->document_id);
        } else {
            $deviceQuery->whereNull('document_id');
        }

        if ($deviceQuery->exists()) {
            return response()->json(['message' => 'This device is already activated for this content.'], 422);
        }

        // Check if this user already has an active activation for this content (on any device)
        $userQuery = RedeemCode::where('user_id', $userId)
            ->where('is_used', true)
            ->where(function ($q) use ($now) {
                $q->whereNull('expires_at')
                    ->orWhere('expires_at', '>', $now);
            });

        if ($redeemCode->document_id) {
            $userQuery->where('document_id', $redeemCode->document_id);
        } else {
            $userQuery->whereNull('document_id');
        }

        if ($userQuery->exists()) {
            return response()->json(['message' => 'Your account already has an active activation for this content.'], 422);
        }

        // Calculate expiration date
        $expiresAt = null;
        if ($redeemCode->duration_type === 'weekly') {
            $expiresAt = Carbon::now()->addWeek();
        } elseif ($redeemCode->duration_type === 'monthly') {
            $expiresAt = Carbon::now()->addMonth();
        }

        $redeemCode->update([
            'is_used' => true,
            'device_id' => $request->device_id,
            'activated_at' => Carbon::now(),
            'expires_at' => $expiresAt,
            'user_id' => $userId,
        ]);

        return response()->json([
            'message' => 'Code redeemed successfully!',
            'activated' => true,
            'target' => $redeemCode->document_id ? 'document' : 'device',
            'expires_at' => $expiresAt ? $expiresAt->toDateTimeString() : null
        ]);
    }

    public function checkStatus(Request $request)
    {
        $request->validate([
            'device_id' => 'required|string',
            'document_id' => 'nullable|exists:documents,id',
        ]);

        $now = Carbon::now();
        $userId = auth('sanctum')->id(); // May be null for unauthenticated callers

        // Device activation (full access, no document) - must not be expired
        $deviceActivated = RedeemCode::where('device_id', $request->device_id)
            ->where('is_used', true)
            ->whereNull('document_id')
            ->where(function ($q) use ($now) {
                $q->whereNull('expires_at')
                    ->orWhere('expires_at', '>', $now);
            })
            ->exists();

        // Also check by user account (covers new/different devices) when logged in
        $userFullAccess = false;
        if ($userId) {
            $userFullAccess = RedeemCode::where('user_id', $userId)
                ->where('is_used', true)
                ->whereNull('document_id')
                ->where(function ($q) use ($now) {
                    $q->whereNull('expires_at')
                        ->orWhere('expires_at', '>', $now);
                })
                ->exists();
        }

        // Document specific activation - must not be expired
        $documentActivated = false;
        if ($request->document_id) {
            $documentActivated = RedeemCode::where('device_id', $request->device_id)
                ->where('is_used', true)
                ->where('document_id', $request->document_id)
                ->where(function ($q) use ($now) {
                    $q->whereNull('expires_at')
                        ->orWhere('expires_at', '>', $now);
                })
                ->exists();

            // Also check by user for the specific document (covers new/different devices)
            if (!$documentActivated && $userId) {
                $documentActivated = RedeemCode::where('user_id', $userId)
                    ->where('is_used', true)
                    ->where('document_id', $request->document_id)
                    ->where(function ($q) use ($now) {
                        $q->whereNull('expires_at')
                            ->orWhere('expires_at', '>', $now);
                    })
                    ->exists();
            }
        }

        $fullAccess = $deviceActivated || $userFullAccess;

        return response()->json([
            'activated' => $fullAccess || $documentActivated,
            'full_access' => $fullAccess,
            'document_access' => $documentActivated
        ]);
    }
}
