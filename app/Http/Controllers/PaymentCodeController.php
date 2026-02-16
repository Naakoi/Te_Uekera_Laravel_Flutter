<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Models\PaymentCode;
use App\Models\Document;
use Illuminate\Support\Str;
use Inertia\Inertia;

class PaymentCodeController extends Controller
{
    public function index()
    {
        return Inertia::render('Codes/Index', [
            'codes' => PaymentCode::with(['document', 'generator', 'user'])->latest()->paginate(20),
            'documents' => Document::all(),
        ]);
    }

    public function generate(Request $request)
    {
        if (auth()->user()->role !== 'admin' && !auth()->user()->can_create_vouchers) {
            abort(403, 'Unauthorized. You do not have permission to generate payment codes.');
        }

        $request->validate([
            'document_id' => 'nullable|exists:documents,id',
            'count' => 'required|integer|min:1|max:100',
        ]);

        for ($i = 0; $i < $request->count; $i++) {
            PaymentCode::create([
                'code' => Str::random(8),
                'document_id' => $request->document_id,
                'generated_by' => auth()->id(),
            ]);
        }

        return redirect()->back()->with('success', $request->count . ' codes generated successfully.');
    }
}
