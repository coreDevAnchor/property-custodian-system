import { Form, Head } from '@inertiajs/react';
import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';
import AppLogoIcon from '@/components/app-logo-icon';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { useAppearance } from '@/hooks/use-appearance';
import { store } from '@/routes/login';
import otpRoutes from '@/routes/password/otp';

async function postJson(url: string, data: Record<string, string>) {
    const csrf = document.cookie
        .split('; ')
        .find((row) => row.startsWith('XSRF-TOKEN='))
        ?.split('=')[1];

    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            'X-XSRF-TOKEN': csrf ? decodeURIComponent(csrf) : '',
        },
        body: JSON.stringify(data),
    });

    const body = await res.json().catch(() => ({}));

    return { ok: res.ok, body };
}

function formatMmss(totalSeconds: number) {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;

    return `${m}:${String(s).padStart(2, '0')}`;
}

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
    const [mode, setMode] = useState<'login' | 'reset'>('login');
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [otpSent, setOtpSent] = useState(false);
    const [sendingOtp, setSendingOtp] = useState(false);
    const [resetting, setResetting] = useState(false);
    const [otpInfo, setOtpInfo] = useState<string | null>(null);
    const [otpError, setOtpError] = useState<string | null>(null);
    const [resetMessage, setResetMessage] = useState<string | null>(null);
    const [expiresAt, setExpiresAt] = useState<number | null>(null);
    const [cooldownUntil, setCooldownUntil] = useState<number | null>(null);
    const [now, setNow] = useState(() => Date.now());

    const isTicking = expiresAt !== null || cooldownUntil !== null;

    useEffect(() => {
        if (!isTicking) {
            return;
        }

        const id = window.setInterval(() => setNow(Date.now()), 1000);

        return () => window.clearInterval(id);
    }, [isTicking]);

    const secondsLeft = expiresAt
        ? Math.max(0, Math.ceil((expiresAt - now) / 1000))
        : 0;
    const cooldownLeft = cooldownUntil
        ? Math.max(0, Math.ceil((cooldownUntil - now) / 1000))
        : 0;

    function switchMode(next: 'login' | 'reset') {
        setMode(next);
        setOtpError(null);
        setOtpInfo(null);
        setOtpSent(false);
        setOtp('');
        setNewPassword('');
        setExpiresAt(null);
        setCooldownUntil(null);
    }

    async function handleSendOtp() {
        setOtpError(null);
        setOtpInfo(null);

        if (!email.trim()) {
            setOtpError('Enter your email first.');

            return;
        }

        setSendingOtp(true);

        try {
            const res = await postJson(otpRoutes.send.url(), {
                email: email.trim(),
            });

            if (res.ok) {
                setOtpInfo(res.body.message);
                setOtpSent(true);
                setExpiresAt(Date.now() + (res.body.expires_in ?? 180) * 1000);
                setCooldownUntil(Date.now() + 60 * 1000);
                setNow(Date.now());
            } else {
                setOtpError(res.body.message ?? 'Failed to send the code.');

                if (res.body.resend_in) {
                    setCooldownUntil(Date.now() + res.body.resend_in * 1000);
                    setNow(Date.now());
                }
            }
        } catch {
            setOtpError('Something went wrong. Please try again.');
        } finally {
            setSendingOtp(false);
        }
    }

    async function handleResetPassword(e: React.FormEvent) {
        e.preventDefault();
        setOtpError(null);

        setResetting(true);

        try {
            const res = await postJson(otpRoutes.reset.url(), {
                email: email.trim(),
                otp: otp.trim(),
                password: newPassword,
            });

            if (res.ok) {
                setResetMessage(res.body.message);
                switchMode('login');
            } else {
                setOtpError(res.body.message ?? 'Failed to reset the password.');
            }
        } catch {
            setOtpError('Something went wrong. Please try again.');
        } finally {
            setResetting(false);
        }
    }

    const inputClassName =
        'h-11 rounded-lg border-gray-300 bg-white px-4 text-sm text-gray-900 placeholder:text-gray-400 focus-visible:border-[#e8720c] focus-visible:ring-[#e8720c]/20 dark:border-gray-700 dark:bg-[#18181a] dark:text-white dark:placeholder:text-gray-500 dark:focus-visible:ring-[#e8720c]/30';

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
                    {/* <div className="relative z-10 flex items-center gap-3 px-12 pt-10">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-[#f7941d] to-[#d9530c] shadow-[0_0_20px_rgba(232,114,12,0.4)]">
                            <AppLogoIcon className="h-5 w-5 fill-current text-[#0f0f10]" />
                        </div>
                        <span className="text-sm font-semibold tracking-[0.2em] text-gray-700 dark:text-gray-300">
                            CORE DEV
                        </span>
                    </div> */}

                    {/* centerpiece logo illustration */}
                    <div className="relative z-10 flex flex-1 items-center justify-center">
                        <img
                            src="/images/coreDevlogo-CUQ-ORnY.png_2K_202608261338-removebg-preview.png"
                            alt="coreDev logo"
                            className="h-64 w-64 animate-float rounded-2xl object-contain opacity-90"
                        />
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

                        {mode === 'reset' ? (
                            <>
                                <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                                    Reset password
                                </h2>
                                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                                    Enter your email, request a 6-digit code, and set a new
                                    password. The code expires in 3 minutes.
                                </p>

                                <form
                                    onSubmit={handleResetPassword}
                                    className="mt-8 flex flex-col gap-5"
                                >
                                    <div className="grid gap-4">
                                        {/* Email field */}
                                        <div className="grid gap-1.5">
                                            <Label
                                                htmlFor="reset-email"
                                                className="text-sm font-semibold text-gray-700 dark:text-gray-300"
                                            >
                                                Email
                                            </Label>
                                            <Input
                                                id="reset-email"
                                                type="email"
                                                name="email"
                                                required
                                                autoFocus
                                                tabIndex={1}
                                                autoComplete="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                placeholder="Enter your email"
                                                className={inputClassName}
                                            />
                                        </div>

                                        {/* OTP field + Send OTP button */}
                                        <div className="grid gap-1.5">
                                            <Label
                                                htmlFor="otp"
                                                className="text-sm font-semibold text-gray-700 dark:text-gray-300"
                                            >
                                                Verification code
                                            </Label>
                                            <div className="flex gap-2">
                                                <Input
                                                    id="otp"
                                                    type="text"
                                                    name="otp"
                                                    required
                                                    tabIndex={2}
                                                    inputMode="numeric"
                                                    autoComplete="one-time-code"
                                                    maxLength={6}
                                                    value={otp}
                                                    onChange={(e) =>
                                                        setOtp(
                                                            e.target.value.replace(/\D/g, ''),
                                                        )
                                                    }
                                                    placeholder="6-digit code"
                                                    className={`flex-1 ${inputClassName}`}
                                                />
                                                <button
                                                    type="button"
                                                    tabIndex={3}
                                                    onClick={handleSendOtp}
                                                    disabled={sendingOtp || cooldownLeft > 0}
                                                    className="flex h-11 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-[#18181a] dark:text-gray-200 dark:hover:bg-[#1f1f21]"
                                                >
                                                    {sendingOtp && <Spinner />}
                                                    {sendingOtp
                                                        ? 'Sending...'
                                                        : cooldownLeft > 0
                                                            ? `Resend (${formatMmss(cooldownLeft)})`
                                                            : otpSent
                                                                ? 'Resend OTP'
                                                                : 'Send OTP'}
                                                </button>
                                            </div>

                                            {otpInfo && (
                                                <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                                                    {otpInfo}
                                                </p>
                                            )}

                                            {otpSent &&
                                                (secondsLeft > 0 ? (
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                                        Code expires in{' '}
                                                        <span className="font-semibold text-gray-700 dark:text-gray-200">
                                                            {formatMmss(secondsLeft)}
                                                        </span>
                                                    </p>
                                                ) : (
                                                    <p className="text-xs font-medium text-red-600 dark:text-red-400">
                                                        Code expired — request a new one.
                                                    </p>
                                                ))}

                                            <InputError message={otpError ?? undefined} />
                                        </div>

                                        {/* New password field */}
                                        <div className="grid gap-1.5">
                                            <Label
                                                htmlFor="new-password"
                                                className="text-sm font-semibold text-gray-700 dark:text-gray-300"
                                            >
                                                New password
                                            </Label>
                                            <PasswordInput
                                                id="new-password"
                                                name="password"
                                                required
                                                tabIndex={4}
                                                autoComplete="new-password"
                                                value={newPassword}
                                                onChange={(e) =>
                                                    setNewPassword(e.target.value)
                                                }
                                                placeholder="Enter a new password"
                                                className={inputClassName}
                                            />
                                        </div>
                                    </div>

                                    {/* Change password button */}
                                    <div className="mt-2">
                                        <button
                                            type="submit"
                                            tabIndex={5}
                                            disabled={resetting}
                                            className="flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#f7941d] to-[#d9530c] text-sm font-bold text-[#0f0f10] shadow-[0_4px_16px_rgba(217,83,12,0.35)] transition-all duration-150 hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                                        >
                                            {resetting && <Spinner />}
                                            {resetting ? 'Changing password...' : 'Change Password'}
                                        </button>
                                    </div>

                                    <p className="text-center text-sm text-gray-500 dark:text-gray-500">
                                        Remembered it?{' '}
                                        <button
                                            type="button"
                                            onClick={() => switchMode('login')}
                                            className="cursor-pointer font-semibold text-gray-700 underline-offset-2 hover:underline dark:text-gray-200"
                                        >
                                            Back to sign in
                                        </button>
                                    </p>
                                </form>
                            </>
                        ) : (
                            <>
                                <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                                    Welcome back
                                </h2>
                                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                                    Enter your credentials to access the Property Custodian
                                    System.
                                </p>

                                {(status || resetMessage) && (
                                    <div className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 dark:border-emerald-800/40 dark:bg-emerald-950/40 dark:text-emerald-400">
                                        {status ?? resetMessage}
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
                                                {/* Email field */}
                                                <div className="grid gap-1.5">
                                                    <Label
                                                        htmlFor="email"
                                                        className="text-sm font-semibold text-gray-700 dark:text-gray-300"
                                                    >
                                                        Email
                                                    </Label>
                                                    <Input
                                                        id="email"
                                                        type="email"
                                                        name="email"
                                                        required
                                                        autoFocus
                                                        tabIndex={1}
                                                        autoComplete="email"
                                                        placeholder="Enter your email"
                                                        className={inputClassName}
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
                                                        className={inputClassName}
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

                                            {/* Forgot password */}
                                            <p className="text-center text-sm text-gray-500 dark:text-gray-500">
                                                Forgot your password?{' '}
                                                <button
                                                    type="button"
                                                    onClick={() => switchMode('reset')}
                                                    className="cursor-pointer font-semibold text-gray-700 underline-offset-2 hover:underline dark:text-gray-200"
                                                >
                                                    Reset it here
                                                </button>
                                            </p>

                                            {/* Role hint */}
                                            <p className="text-center text-sm text-gray-500 dark:text-gray-500">
                                                Enter your credentials to continue.
                                            </p>
                                        </>
                                    )}
                                </Form>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
