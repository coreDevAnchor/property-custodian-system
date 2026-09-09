<?php

namespace App\Providers;

use App\Models\User;
use App\Observers\UserObserver;
use App\Support\Mail\BrevoTransport;
use Carbon\CarbonImmutable;
use Illuminate\Database\Query\Builder;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureDefaults();
        $this->registerQueryBuilderMacros();
        $this->registerMailTransports();

        User::observe(UserObserver::class);
    }

    /**
     * Register custom mail transports.
     */
    protected function registerMailTransports(): void
    {
        Mail::extend('brevo', fn (): BrevoTransport => new BrevoTransport(
            (string) config('services.brevo.key'),
        ));
    }

    /**
     * Register case-insensitive search helpers that work on both
     * PostgreSQL and SQLite (the ILIKE operator is Postgres-only).
     */
    protected function registerQueryBuilderMacros(): void
    {
        Builder::macro('caseInsensitiveLike', function (string $column, string $value) {
            return $this->whereRaw('LOWER('.$column.') LIKE LOWER(?)', [$value]);
        });

        Builder::macro('orCaseInsensitiveLike', function (string $column, string $value) {
            return $this->orWhereRaw('LOWER('.$column.') LIKE LOWER(?)', [$value]);
        });
    }

    /**
     * Configure default behaviors for production-ready applications.
     */
    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        DB::prohibitDestructiveCommands(
            app()->isProduction(),
        );

        Password::defaults(fn (): ?Password => app()->isProduction()
            ? Password::min(12)
                ->mixedCase()
                ->letters()
                ->numbers()
                ->symbols()
                ->uncompromised()
            : null,
        );
    }
}
