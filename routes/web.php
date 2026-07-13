<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\AssetController;
use App\Http\Controllers\BorrowRequestController;
use App\Http\Controllers\ReturnController;
use App\Http\Controllers\EmployeeController;
use App\Http\Controllers\EmployeeDashboardController;
use App\Http\Controllers\AvailableAssetController;
use App\Http\Controllers\MyBorrowController;
use App\Http\Controllers\EmployeeReturnController;
use App\Http\Controllers\AuditTrailController;
use App\Http\Controllers\CustodianDashboardController;
use App\Http\Controllers\CustodianController;

Route::redirect('/', '/login');

Route::middleware(['auth', 'verified'])
    ->prefix('custodian')
    ->name('custodian.')
    ->group(function () {

        Route::get('/dashboard', [CustodianDashboardController::class, 'index'])
            ->name('dashboard');
        Route::resource('assets', AssetController::class);
        Route::resource('borrow-requests', BorrowRequestController::class);
        Route::resource('returns', ReturnController::class);
        Route::resource('employees', EmployeeController::class)->except(['create', 'edit']);
        Route::get('/activity', [AuditTrailController::class, 'index'])
            ->name('activity.index');
        Route::resource('custodians', CustodianController::class)->except(['create', 'edit']);
    });

Route::get('/dev-custodian', function () {
    return Inertia::render('custodian/dashboard');
})->name('dev.custodian');

Route::middleware(['auth', 'verified'])
    ->prefix('employee')
    ->name('employee.')
    ->group(function () {
        Route::get('/dashboard', [EmployeeDashboardController::class, 'index'])->name('dashboard');

        Route::get('/assets', [AvailableAssetController::class, 'index'])
            ->name('assets.index');

        Route::get('/borrows', [MyBorrowController::class, 'index'])
            ->name('borrows.index');

        Route::post('/borrow-requests', [BorrowRequestController::class, 'store'])
            ->name('borrow-requests.store');

        Route::post('/returns', [EmployeeReturnController::class, 'store'])
            ->name('returns.store');
    });

// Route::middleware(['auth', 'verified'])
//     ->group(function () {
//     });


require __DIR__ . '/settings.php';