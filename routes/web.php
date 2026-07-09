<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\AssetController;
use App\Http\Controllers\BorrowRequestController;

Route::redirect('/', '/login');

Route::middleware(['auth', 'verified'])
    ->prefix('custodian')
    ->name('custodian.')
    ->group(function () {

        Route::get('/dashboard', function () {
            return Inertia::render('custodian/dashboard');
        })->name('dashboard');

        Route::resource('assets', AssetController::class);
        Route::resource('borrow-requests', BorrowRequestController::class);
    });

Route::get('/dev-custodian', function () {
    return Inertia::render('custodian/dashboard');
})->name('dev.custodian');

//Route::resource('assets', AssetController::class);
Route::resource('borrow-requests', BorrowRequestController::class);

require __DIR__ . '/settings.php';