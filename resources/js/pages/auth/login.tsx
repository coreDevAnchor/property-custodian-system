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
    const [selectedRole, setSelectedRole] = useState<'custodian' | 'employee' | null>(null);

    const handleRoleSubmit = (role: 'custodian' | 'employee') => {
        setSelectedRole(role);
    };

    return (
        <>
            <Head title="Log in" />

            {status && (
                <div className="mb-4 text-center text-sm font-medium text-green-600">
                    {status}
                </div>
            )}

            <Form
                {...store.form()}
                resetOnSuccess={['password']}
                className="flex flex-col gap-5"
            >
                {({ processing, errors }) => (
                    <>
                        {/* Hidden role field */}
                        <input type="hidden" name="role" value={selectedRole ?? ''} />

                        <div className="grid gap-4">
                            {/* Username field */}
                            <div className="grid gap-1.5">
                                <Label
                                    htmlFor="email"
                                    className="text-sm font-semibold text-gray-700"
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
                                    className="h-11 rounded-lg border-gray-200 bg-white px-4 text-sm placeholder:text-gray-400 focus-visible:border-[#0d7a5f] focus-visible:ring-[#0d7a5f]/20 text-black"
                                />
                                <InputError message={errors.email} />
                            </div>

                            {/* Password field */}
                            <div className="grid gap-1.5">
                                <Label
                                    htmlFor="password"
                                    className="text-sm font-semibold text-gray-700"
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
                                    className="h-11 rounded-lg border-gray-200 bg-white px-4 text-sm placeholder:text-gray-400 focus-visible:border-[#0d7a5f] focus-visible:ring-[#0d7a5f]/20 text-black"
                                />
                                <InputError message={errors.password} />
                            </div>
                        </div>

                        {/* Role-based login buttons */}
                        <div className="mt-2 flex flex-col gap-3">
                            {/* Login as Custodian — filled teal */}
                            <button
                                type="submit"
                                tabIndex={3}
                                disabled={processing}
                                onClick={() => handleRoleSubmit('custodian')}
                                data-test="login-custodian-button"
                                className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#0d7a5f] text-sm font-bold text-white shadow-sm transition-all duration-150 hover:bg-[#0a6550] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
                            >
                                {processing && selectedRole === 'custodian' && <Spinner />}
                                Login as Custodian
                            </button>

                            {/* Login as Employee — outlined */}
                            <button
                                type="submit"
                                tabIndex={4}
                                disabled={processing}
                                onClick={() => handleRoleSubmit('employee')}
                                data-test="login-employee-button"
                                className="flex h-12 w-full items-center justify-center gap-2 rounded-lg border-2 border-gray-200 bg-white text-sm font-bold text-gray-800 shadow-sm transition-all duration-150 hover:border-gray-300 hover:bg-gray-50 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
                            >
                                {processing && selectedRole === 'employee' && <Spinner />}
                                Login as Employee
                            </button>
                        </div>

                        {/* Role hint */}
                        <p className="text-center text-sm text-amber-500/80">
                            Choose your role to continue.
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
