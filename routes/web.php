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
use App\Http\Controllers\CurrentBorrowsController;
use App\Http\Controllers\EmployeeReturnController;
use App\Http\Controllers\AuditTrailController;
use App\Http\Controllers\CustodianDashboardController;
use App\Http\Controllers\CustodianController;
use App\Http\Controllers\Custodian\ReportController;
use App\Http\Controllers\Auth\ForcePasswordChangeController;
use App\Http\Controllers\BorrowRenewalController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\AssetTypeController;

Route::redirect('/', '/login')->name('home');

Route::middleware(['auth'])->group(function () {
    Route::get('/force-change-password', [ForcePasswordChangeController::class, 'edit'])
        ->name('password.force.edit');

    Route::post('/force-change-password', [ForcePasswordChangeController::class, 'update'])
        ->name('password.force.update');
});

Route::middleware(['auth', 'verified'])
    ->group(function () {
        Route::get('/documentation', function () {
            return Inertia::render('documentations/documentation');
        })->name('documentation');

        Route::get('/notifications', [NotificationController::class, 'index'])->name('notifications.index');
        Route::patch('/notifications/{notification}/read', [NotificationController::class, 'markAsRead'])->name('notifications.read');
        Route::patch('/notifications/read-all', [NotificationController::class, 'markAllAsRead'])->name('notifications.read-all');
        Route::delete('/notifications/read', [NotificationController::class, 'destroyRead'])->name('notifications.destroy-read');
        Route::patch('/notifications/{notification}/unread', [NotificationController::class, 'markAsUnread'])->name('notifications.unread');
        Route::delete('/notifications/{notification}', [NotificationController::class, 'destroy'])->name('notifications.destroy');
    });

Route::middleware(['auth', 'verified'])
    ->prefix('custodian')
    ->name('custodian.')
    ->group(function () {

        Route::get('/dashboard', [CustodianDashboardController::class, 'index'])
            ->name('dashboard');

        Route::resource('assets', AssetController::class);

        Route::get('assets/import/template', [AssetController::class, 'downloadTemplate'])
            ->name('assets.import.template');

        Route::post('assets/import', [AssetController::class, 'import'])
            ->name('assets.import');

        Route::post('categories', [CategoryController::class, 'store'])->name('categories.store');
        Route::post('asset-types', [AssetTypeController::class, 'store'])->name('asset-types.store');

        Route::resource('borrow-requests', BorrowRequestController::class);

        // Manual overdue reminder
        Route::post(
            'borrow-requests/{borrowRequest}/remind',
            [BorrowRequestController::class, 'sendOverdueReminder']
        )->name('borrow-requests.remind');

        Route::patch('borrow-renewals/{borrowRenewal}', [BorrowRenewalController::class, 'update'])
            ->name('borrow-renewals.update');

        Route::resource('returns', ReturnController::class);

        Route::resource('employees', EmployeeController::class)
            ->except(['create', 'edit']);

        Route::get('/activity', [AuditTrailController::class, 'index'])
            ->name('activity.index');

        Route::resource('custodians', CustodianController::class)
            ->except(['create', 'edit']);

        Route::get('/reports', [ReportController::class, 'index'])
            ->name('reports');

        Route::get('/reports/export-csv', [ReportController::class, 'exportCsv'])
            ->name('reports.export');

        Route::get('/reports/export-pdf', [ReportController::class, 'exportPdf'])
            ->name('reports.export-pdf');
    });

Route::get('/dev-custodian', function () {
    return Inertia::render('custodian/dashboard');
})->name('dev.custodian');

Route::middleware(['auth', 'verified'])
    ->prefix('employee')
    ->name('employee.')
    ->group(function () {

        Route::get('/dashboard', [EmployeeDashboardController::class, 'index'])
            ->name('dashboard');

        Route::get('/assets', [AvailableAssetController::class, 'index'])
            ->name('assets.index');

        Route::get('/borrows', [MyBorrowController::class, 'index'])
            ->name('borrows.index');

        Route::get('/current-borrows', [CurrentBorrowsController::class, 'index'])
            ->name('current-borrows.index');

        Route::post('/borrow-requests', [BorrowRequestController::class, 'store'])
            ->name('borrow-requests.store');

        Route::post('/borrow-renewals', [BorrowRenewalController::class, 'store'])
            ->name('borrow-renewals.store');

        Route::post('/returns', [EmployeeReturnController::class, 'store'])
            ->name('returns.store');
    });

// Load test CSRF token endpoint
Route::get('/loadtest/token', function () {
    return response()->json(['token' => session()->token()]);
});

require __DIR__ . '/settings.php';