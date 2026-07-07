<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::inertia('/', 'welcome')->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');
});

Route::get('/dev-custodian', function () {
    return Inertia::render('custodian/dashboard');
})->name('dev.custodian');

require __DIR__ . '/settings.php';
