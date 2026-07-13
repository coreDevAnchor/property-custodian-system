import { Form, Head } from '@inertiajs/react';
import { useState } from 'react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { store } from '@/routes/login';

type Props = {
    status?: string;
    canResetPassword: boolean;
};

export default function Login({ status }: Props) {
    return (
        <>
            <Head title="Log in" />

            {status && (
                <div className="mb-4 text-center text-sm font-medium text-green-600 dark:text-green-400">
                    {status}
                </div>
            )}

            <Form
                action={store().url}
                method="post"
                resetOnSuccess={['password']}
                className="flex flex-col gap-5"
            >
                {({ processing, errors }) => (
                    <>
                        <div className="grid gap-4">
                            {/* Username field */}
                            <div className="grid gap-1.5">
                                <Label
                                    htmlFor="email"
                                    className="text-sm font-semibold text-gray-700 dark:text-gray-200"
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
                                    className="h-11 rounded-lg border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 px-4 text-sm focus-visible:border-[#0d7a5f] focus-visible:ring-[#0d7a5f]/20"
                                />
                                <InputError message={errors.email} />
                            </div>

                            {/* Password field */}
                            <div className="grid gap-1.5">
                                <Label
                                    htmlFor="password"
                                    className="text-sm font-semibold text-gray-700 dark:text-gray-200"
                                >
                                    Password
                                </Label>
                                <PasswordInput
                                    id="password"
                                    name="password"
                                    required
                                    tabIndex={2}
                                    autoComplete="current-password"
                                    placeholder="Enter your password"
                                    className="h-11 rounded-lg border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 px-4 text-sm focus-visible:border-[#0d7a5f] focus-visible:ring-[#0d7a5f]/20"
                                />
                                <InputError message={errors.password} />
                            </div>
                        </div>

                        {/* Role-based login buttons */}
                        <div className="mt-4">
                            <button
                                type="submit"
                                tabIndex={3}
                                disabled={processing}
                                data-test="login-button"
                                className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#0d7a5f] text-sm font-bold text-white shadow-sm transition-all duration-150 hover:bg-[#0a6550] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70 cursor-pointer"
                            >
                                {processing && <Spinner />}
                                {processing ? 'Signing in...' : 'Sign In'}
                            </button>
                        </div>

                        {/* Role hint */}
                        <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                            Enter your credentials to continue.
                        </p>
                    </>
                )}
            </Form>
        </>
    );
}

Login.layout = {
    title: 'Property Custodian System',
    description: 'Sign in to manage and track property assets.',
};
