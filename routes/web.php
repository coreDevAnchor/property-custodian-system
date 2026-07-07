<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::redirect('/', '/login');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/custodian/dashboard', function () {
        return Inertia::render('custodian/dashboard');
    })->name('custodian.dashboard');
});

Route::get('/dev-custodian', function () {
    return Inertia::render('custodian/dashboard');
})->name('dev.custodian');

require __DIR__ . '/settings.php';