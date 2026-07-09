<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\AssetController;
use App\Http\Controllers\BorrowRequestController;
use App\Http\Controllers\ReturnController;
use App\Http\Controllers\EmployeeController;

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
        Route::resource('returns', ReturnController::class);
        Route::resource('employees', EmployeeController::class)->except(['create', 'edit']);
    });

Route::get('/dev-custodian', function () {
    return Inertia::render('custodian/dashboard');
})->name('dev.custodian');

//Route::resource('assets', AssetController::class);
Route::resource('borrow-requests', BorrowRequestController::class);

require __DIR__ . '/settings.php';