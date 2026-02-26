<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

Route::post('/login', [App\Http\Controllers\Api\AuthController::class, 'login']);

// Public Stripe Success Callback
Route::get('/payments/stripe/success', [App\Http\Controllers\StripeController::class, 'apiSuccess'])->name('api.stripe.success');

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [App\Http\Controllers\Api\AuthController::class, 'logout']);
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    // Payment Checkout
    Route::post('/payments/stripe/checkout', [App\Http\Controllers\StripeController::class, 'apiCheckout'])->name('api.stripe.checkout');

    // Redeem Code — requires authenticated user
    Route::post('/redeem-code', [App\Http\Controllers\RedeemCodeController::class, 'redeem']);
});

Route::get('/documents/{document}/pages/{page}', [App\Http\Controllers\DocumentController::class, 'pageImage']);

// Check status is public (read-only)
Route::post('/check-status', [App\Http\Controllers\RedeemCodeController::class, 'checkStatus']);

Route::get('/documents', [App\Http\Controllers\DocumentController::class, 'apiIndex']);

Route::get('/images/{path}', function ($path) {
    // Prevent directory traversal
    if (str_contains($path, '..')) {
        return response()->json(['error' => 'Invalid path'], 400);
    }

    $filePath = storage_path('app/public/' . $path);

    if (!file_exists($filePath)) {
        return response()->json(['error' => 'File not found at ' . $filePath], 404);
    }

    return response()->file($filePath);
})->where('path', '.*');

