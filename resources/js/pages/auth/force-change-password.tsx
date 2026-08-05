import { Form, Head } from '@inertiajs/react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';

export default function ForceChangePassword() {
    return (
        <>
            <Head title="Change Your Password" />

            <Form
                action="/force-change-password"
                method="post"
                resetOnSuccess={['password', 'password_confirmation']}
                className="flex flex-col gap-5"
            >
                {({ processing, errors }) => (
                    <>
                        <div className="grid gap-4">
                            <div className="grid gap-1.5">
                                <Label
                                    htmlFor="password"
                                    className="text-sm font-semibold text-gray-700 dark:text-gray-200"
                                >
                                    New Password
                                </Label>

                                <PasswordInput
                                    id="password"
                                    name="password"
                                    required
                                    autoFocus
                                    autoComplete="new-password"
                                    placeholder="Enter your new password"
                                    className="h-11 rounded-lg border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-white px-4 text-sm"
                                />

                                <InputError message={errors.password} />
                            </div>

                            <div className="grid gap-1.5">
                                <Label
                                    htmlFor="password_confirmation"
                                    className="text-sm font-semibold text-gray-700 dark:text-gray-200"
                                >
                                    Confirm Password
                                </Label>

                                <PasswordInput
                                    id="password_confirmation"
                                    name="password_confirmation"
                                    required
                                    autoComplete="new-password"
                                    placeholder="Confirm your new password"
                                    className="h-11 rounded-lg border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-white px-4 text-sm"
                                />

                                <InputError
                                    message={errors.password_confirmation}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={processing}
                            className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-bold text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-70"
                        >
                            {processing && <Spinner />}
                            {processing
                                ? 'Updating Password...'
                                : 'Change Password'}
                        </button>
                    </>
                )}
            </Form>
        </>
    );
}

ForceChangePassword.layout = {
    title: 'Change Your Password',
    description:
        'For security reasons, you must change your default password before continuing.',
};