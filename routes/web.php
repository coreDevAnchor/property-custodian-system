<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\AssetController;
use App\Http\Controllers\BorrowRequestController;

Route::redirect('/', '/login');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/custodian/dashboard', function () {
        return Inertia::render('custodian/dashboard');
    })->name('custodian.dashboard');

    Route::resource('custodian/assets', AssetController::class);

});

Route::get('/dev-custodian', function () {
    return Inertia::render('custodian/dashboard');
})->name('dev.custodian');

//Route::resource('assets', AssetController::class);
Route::resource('borrow-requests', BorrowRequestController::class);

require __DIR__ . '/settings.php';