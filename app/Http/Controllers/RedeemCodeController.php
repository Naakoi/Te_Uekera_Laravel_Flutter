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

        // Check if this device already has this active activation (not expired)
        $query = RedeemCode::where('device_id', $request->device_id)
            ->where('is_used', true)
            ->where(function ($q) {
                $q->whereNull('expires_at')
                    ->orWhere('expires_at', '>', Carbon::now());
            });

        if ($redeemCode->document_id) {
            $query->where('document_id', $redeemCode->document_id);
        } else {
            $query->whereNull('document_id');
        }

        if ($query->exists()) {
            return response()->json(['message' => 'This device is already activated for this content.'], 422);
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
            'user_id' => auth('sanctum')->id(),
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

        // Device activation (full access) - must not be expired
        $deviceActivated = RedeemCode::where('device_id', $request->device_id)
            ->where('is_used', true)
            ->whereNull('document_id')
            ->where(function ($q) use ($now) {
                $q->whereNull('expires_at')
                    ->orWhere('expires_at', '>', $now);
            })
            ->exists();

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
        }

        return response()->json([
            'activated' => $deviceActivated || $documentActivated,
            'full_access' => $deviceActivated,
            'document_access' => $documentActivated
        ]);
    }
}
