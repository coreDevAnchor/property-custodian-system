import { Form, Head } from '@inertiajs/react';
import { Moon, Sun } from 'lucide-react';
import AppLogoIcon from '@/components/app-logo-icon';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { useAppearance } from '@/hooks/use-appearance';
import { store } from '@/routes/login';

function ThemeToggle() {
    const { resolvedAppearance, updateAppearance } = useAppearance();
    const isDark = resolvedAppearance === 'dark';

    return (
        <button
            type="button"
            onClick={() => updateAppearance(isDark ? 'light' : 'dark')}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            className="fixed right-5 top-5 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 shadow-sm transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-[#18181a] dark:text-gray-300 dark:hover:bg-[#1f1f21] cursor-pointer"
        >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
    );
}

type Props = {
    status?: string;
    canResetPassword: boolean;
};

export default function Login({ status }: Props) {
    return (
        <>
            <Head title="Log in" />

            <ThemeToggle />

            <div className="flex min-h-screen w-full bg-white dark:bg-[#0f0f10]">
                {/* Left panel — brand side */}
                <div className="relative hidden w-1/2 overflow-hidden lg:flex lg:flex-col lg:justify-between">
                    {/* base gradient */}
                    <div className="absolute inset-0 bg-gradient-to-br from-[#fdf3e7] via-[#fbeee0] to-[#f8e6d3] dark:from-[#161615] dark:via-[#0f0f10] dark:to-[#0a0a0a]" />

                    {/* radial glow behind mark */}
                    <div className="absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(217,83,12,0.16)_0%,rgba(217,83,12,0)_70%)] dark:bg-[radial-gradient(circle,rgba(232,114,12,0.28)_0%,rgba(232,114,12,0)_70%)]" />

                    {/* subtle grid texture */}
                    <div
                        className="absolute inset-0 opacity-[0.08] dark:opacity-[0.06]"
                        style={{
                            backgroundImage:
                                'linear-gradient(#d9530c 1px, transparent 1px), linear-gradient(90deg, #d9530c 1px, transparent 1px)',
                            backgroundSize: '48px 48px',
                        }}
                    />

                    {/* top brand mark */}
                    <div className="relative z-10 flex items-center gap-3 px-12 pt-10">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-[#f7941d] to-[#d9530c] shadow-[0_0_20px_rgba(232,114,12,0.4)]">
                            <AppLogoIcon className="h-5 w-5 fill-current text-[#0f0f10]" />
                        </div>
                        <span className="text-sm font-semibold tracking-[0.2em] text-gray-700 dark:text-gray-300">
                            CORE DEV
                        </span>
                    </div>

                    {/* centerpiece gear illustration */}
                    <div className="relative z-10 flex flex-1 items-center justify-center">
                        <svg viewBox="0 0 200 200" className="h-64 w-64 opacity-90">
                            <defs>
                                <linearGradient id="gearGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#f7941d" />
                                    <stop offset="100%" stopColor="#c2410c" />
                                </linearGradient>
                            </defs>
                            <circle cx="100" cy="100" r="70" fill="none" stroke="url(#gearGrad)" strokeWidth="3" opacity="0.5" />
                            <circle cx="100" cy="100" r="46" fill="none" stroke="url(#gearGrad)" strokeWidth="10" />
                            <circle cx="100" cy="100" r="46" fill="none" className="stroke-[#fbeee0] dark:stroke-[#0f0f10]" strokeWidth="10" strokeDasharray="1 71" strokeDashoffset="0" />
                            {Array.from({ length: 8 }).map((_, i) => {
                                const angle = (i * 360) / 8;
                                return (
                                    <rect
                                        key={i}
                                        x="94"
                                        y="18"
                                        width="12"
                                        height="26"
                                        rx="2"
                                        className="fill-gray-400 dark:fill-[#2a2a2a]"
                                        transform={`rotate(${angle} 100 100)`}
                                    />
                                );
                            })}
                        </svg>
                    </div>

                    {/* bottom copy */}
                    <div className="relative z-10 px-12 pb-14">
                        <h1 className="max-w-md text-4xl font-bold leading-tight tracking-tight text-gray-900 dark:text-white">
                            Every asset, accounted for.
                        </h1>
                        <p className="mt-4 max-w-sm text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                            Sign in to track, assign, and audit property across your
                            organization from one place.
                        </p>
                    </div>
                </div>

                {/* Right panel — form side */}
                <div className="flex w-full flex-col justify-center px-6 py-12 sm:px-12 lg:w-1/2 lg:px-20">
                    <div className="mx-auto w-full max-w-sm">
                        {/* mobile-only brand mark */}
                        <div className="mb-10 flex items-center gap-3 lg:hidden">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[#f7941d] to-[#d9530c]">
                                <AppLogoIcon className="h-4 w-4 fill-current text-[#0f0f10]" />
                            </div>
                            <span className="text-sm font-semibold tracking-[0.2em] text-gray-700 dark:text-gray-200">
                                CORE DEV
                            </span>
                        </div>

                        <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                            Welcome back
                        </h2>
                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                            Enter your credentials to access the Property Custodian System.
                        </p>

                        {status && (
                            <div className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 dark:border-emerald-800/40 dark:bg-emerald-950/40 dark:text-emerald-400">
                                {status}
                            </div>
                        )}

                        <Form
                            action={store().url}
                            method="post"
                            resetOnSuccess={['password']}
                            className="mt-8 flex flex-col gap-5"
                        >
                            {({ processing, errors }) => (
                                <>
                                    <div className="grid gap-4">
                                        {/* Username field */}
                                        <div className="grid gap-1.5">
                                            <Label
                                                htmlFor="email"
                                                className="text-sm font-semibold text-gray-700 dark:text-gray-300"
                                            >
                                                Username
                                            </Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                name="email"
                                                required
                                                autoFocus
                                                tabIndex={1}
                                                autoComplete="email"
                                                placeholder="Enter your username"
                                                className="h-11 rounded-lg border-gray-300 bg-white px-4 text-sm text-gray-900 placeholder:text-gray-400 focus-visible:border-[#e8720c] focus-visible:ring-[#e8720c]/20 dark:border-gray-700 dark:bg-[#18181a] dark:text-white dark:placeholder:text-gray-500 dark:focus-visible:ring-[#e8720c]/30"
                                            />
                                            <InputError message={errors.email} />
                                        </div>

                                        {/* Password field */}
                                        <div className="grid gap-1.5">
                                            <div className="flex items-center justify-between">
                                                <Label
                                                    htmlFor="password"
                                                    className="text-sm font-semibold text-gray-700 dark:text-gray-300"
                                                >
                                                    Password
                                                </Label>
                                            </div>
                                            <PasswordInput
                                                id="password"
                                                name="password"
                                                required
                                                tabIndex={2}
                                                autoComplete="current-password"
                                                placeholder="Enter your password"
                                                className="h-11 rounded-lg border-gray-300 bg-white px-4 text-sm text-gray-900 placeholder:text-gray-400 focus-visible:border-[#e8720c] focus-visible:ring-[#e8720c]/20 dark:border-gray-700 dark:bg-[#18181a] dark:text-white dark:placeholder:text-gray-500 dark:focus-visible:ring-[#e8720c]/30"
                                            />
                                            <InputError message={errors.password} />
                                        </div>
                                    </div>

                                    {/* Sign in button */}
                                    <div className="mt-2">
                                        <button
                                            type="submit"
                                            tabIndex={3}
                                            disabled={processing}
                                            data-test="login-button"
                                            className="flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#f7941d] to-[#d9530c] text-sm font-bold text-[#0f0f10] shadow-[0_4px_16px_rgba(217,83,12,0.35)] transition-all duration-150 hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                                        >
                                            {processing && <Spinner />}
                                            {processing ? 'Signing in...' : 'Sign In'}
                                        </button>
                                    </div>

                                    {/* Role hint */}
                                    <p className="text-center text-sm text-gray-500 dark:text-gray-500">
                                        Enter your credentials to continue.
                                    </p>
                                </>
                            )}
                        </Form>
                    </div>
                </div>
            </div>
        </>
    );
}