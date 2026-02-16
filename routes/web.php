<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| contains the "web" middleware group. Now create something great!
|
*/

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

Route::get('/dashboard', function () {
    return Inertia::render('Dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

use App\Http\Controllers\DocumentController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\StaffController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\PaymentCodeController;
use App\Http\Controllers\UserManagementController;
use App\Http\Controllers\RedeemCodeController;
use App\Http\Controllers\SubscriptionController;
use App\Http\Controllers\StripeController;
use App\Http\Controllers\PayPalController;
use App\Http\Controllers\Admin\SubscriptionPlanController;
use App\Http\Controllers\Admin\GatewaySettingController;

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    // Document Routes
    Route::get('/documents', [DocumentController::class, 'index'])->name('documents.index');
    Route::get('/library', [DocumentController::class, 'library'])->name('documents.library');
    Route::get('/documents/{document}', [DocumentController::class, 'show'])->name('documents.show');
    Route::get('/documents/{document}/reader', [DocumentController::class, 'reader'])->name('documents.reader')->middleware('access');
    Route::get('/documents/{document}/stream', [DocumentController::class, 'stream'])->name('documents.stream')->middleware('access');
    Route::get('/documents/{document}/page/{page}', [DocumentController::class, 'pageImage'])->name('documents.page')->middleware('access');
    Route::get('/documents/{document}/download', [DocumentController::class, 'download'])->name('documents.download')->middleware('access');

    // Payment Routes
    Route::post('/documents/{document}/pay', [PaymentController::class, 'simulatePayment'])->name('payments.simulate');
    Route::post('/payments/redeem', [PaymentController::class, 'redeemCode'])->name('payments.redeem');

    // Subscription Routes
    Route::get('/subscription', [SubscriptionController::class, 'index'])->name('subscription.index');
    Route::post('/subscription/stripe', [StripeController::class, 'checkout'])->name('stripe.checkout');
    Route::get('/subscription/stripe/success', [StripeController::class, 'success'])->name('stripe.success');
    Route::post('/subscription/paypal', [PayPalController::class, 'checkout'])->name('paypal.checkout');
    Route::get('/subscription/paypal/success', [PayPalController::class, 'success'])->name('paypal.success');

    // Redeem Code Routes
    Route::post('/redeem-code', [RedeemCodeController::class, 'redeem'])->name('redeem_code.redeem');
    Route::post('/redeem-code/status', [RedeemCodeController::class, 'checkStatus'])->name('redeem_code.status');

    // Staff Routes
    Route::middleware('role:staff,admin')->group(function () {
        Route::get('/staff/dashboard', [StaffController::class, 'dashboard'])->name('staff.dashboard');
        Route::post('/documents', [StaffController::class, 'store'])->name('documents.store');
        Route::delete('/documents/{document}', [StaffController::class, 'destroy'])->name('documents.destroy');

        Route::get('/codes', [PaymentCodeController::class, 'index'])->name('codes.index');
        Route::post('/codes/generate', [PaymentCodeController::class, 'generate'])->name('codes.generate');

        // User Management
        Route::get('/staff/users', [UserManagementController::class, 'index'])->name('staff.users.index');
        Route::post('/staff/users/{user}/reset-password', [UserManagementController::class, 'resetPassword'])->name('staff.users.reset-password');

        // Redeem Code Management (Accessible by Staff with permission)
        Route::get('/admin/redeem-codes', [RedeemCodeController::class, 'index'])->name('admin.redeem_codes.index');
        Route::post('/admin/redeem-codes/generate', [RedeemCodeController::class, 'generate'])->name('admin.redeem_codes.generate');
        Route::delete('/admin/redeem-codes/{code}', [RedeemCodeController::class, 'destroy'])->name('admin.redeem_codes.delete');
    });

    // Admin Routes
    Route::middleware('role:admin')->group(function () {
        Route::get('/admin/dashboard', [AdminController::class, 'dashboard'])->name('admin.dashboard');
        Route::post('/admin/staff', [AdminController::class, 'createStaff'])->name('admin.staff.create');
        Route::patch('/admin/staff/{user}', [AdminController::class, 'updateStaff'])->name('admin.staff.update');
        Route::patch('/admin/staff/{user}/toggle/{permission}', [AdminController::class, 'togglePermission'])->name('admin.staff.toggle_permission');
        Route::delete('/admin/staff/{user}', [AdminController::class, 'deleteStaff'])->name('admin.staff.delete');

        // Subscription Plans
        Route::get('/admin/subscription-plans', [SubscriptionPlanController::class, 'index'])->name('admin.subscription-plans.index');
        Route::post('/admin/subscription-plans', [SubscriptionPlanController::class, 'store'])->name('admin.subscription-plans.store');
        Route::patch('/admin/subscription-plans/{plan}', [SubscriptionPlanController::class, 'update'])->name('admin.subscription-plans.update');
        Route::delete('/admin/subscription-plans/{plan}', [SubscriptionPlanController::class, 'destroy'])->name('admin.subscription-plans.destroy');

        // Gateway Settings
        Route::get('/admin/gateway-settings', [GatewaySettingController::class, 'index'])->name('admin.gateway-settings.index');
        Route::post('/admin/gateway-settings', [GatewaySettingController::class, 'update'])->name('admin.gateway-settings.update');
    });
});

require __DIR__ . '/auth.php';
