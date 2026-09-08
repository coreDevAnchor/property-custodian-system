import { Form, Head, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import ProfileController from '@/actions/App/Http/Controllers/Settings/ProfileController';
import DeleteUser from '@/components/delete-user';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { edit } from '@/routes/profile';
import { send } from '@/routes/verification';
import type { Auth } from '@/types';

type PageProps = {
    auth: Auth;
    errors?: Record<string, string>;
};

export default function Profile({
    status,
}: {
    status?: string;
}) {
    const { auth, errors: validationErrors } = usePage<PageProps>().props;
    const [preview, setPreview] = useState<string | null>(null);
    const [sending, setSending] = useState(false);

    return (
        <>
            <Head title="Profile settings" />

            <h1 className="sr-only">Profile settings</h1>

            <div className="space-y-6">
                <Heading
                    variant="small"
                    title="Profile"
                    description="Update your name and email address"
                />

                <Form
                    {...ProfileController.update.form()}
                    options={{
                        preserveScroll: true,
                    }}
                    encType="multipart/form-data"
                    className="space-y-6"
                >
                    {({ processing, errors }) => (
                        <>
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-[1fr_auto]">
                                <div className="space-y-6">

                                    {/* Name */}
                                    <div className="grid gap-2">
                                        <Label htmlFor="name">Name</Label>

                                        <Input
                                            id="name"
                                            className="mt-1 block w-full"
                                            defaultValue={auth.user.name}
                                            name="name"
                                            required
                                            autoComplete="name"
                                            placeholder="Full name"
                                        />

                                        <InputError
                                            className="mt-2"
                                            message={errors.name}
                                        />
                                    </div>

                                    {/* Email */}
                                    <div className="grid gap-2">
                                        <Label htmlFor="email">Email address</Label>

                                        <Input
                                            id="email"
                                            type="email"
                                            className="mt-1 block w-full"
                                            defaultValue={auth.user.email}
                                            name="email"
                                            required
                                            autoComplete="username"
                                            placeholder="Email address"
                                        />

                                        <InputError
                                            className="mt-2"
                                            message={errors.email}
                                        />
                                    </div>

                                </div>

                                <div>
                                    <div className="flex flex-col items-center gap-3 self-start -mt-12">
                                        <label
                                            htmlFor="profile_photo"
                                            className="group cursor-pointer"
                                        >
                                            <Avatar className="h-52 w-52 border-2 border-border transition-all duration-200 group-hover:brightness-75">
                                                <AvatarImage
                                                    src={preview ?? auth.user.avatar ?? ''}
                                                    alt={auth.user.name}
                                                />

                                                <AvatarFallback className="text-4xl">
                                                    {auth.user.name
                                                        .split(' ')
                                                        .map((name) => name[0])
                                                        .slice(0, 2)
                                                        .join('')
                                                        .toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                        </label>
                                            <Input
                                                id="profile_photo"
                                                type="file"
                                                name="profile_photo"
                                                accept="image/png,image/jpeg,image/jpg,image/webp"
                                                className="hidden"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];

                                                    if (file) {
                                                        setPreview(URL.createObjectURL(file));
                                                    }
                                                }}
                                            />

                                            <p className="text-center text-sm text-muted-foreground">
                                                Click the photo to change it
                                            </p>

                                            <p className="text-center text-xs text-muted-foreground">
                                                JPG, PNG or WebP • Max 2 MB
                                            </p>

                                            <InputError
                                                className="text-center"
                                                message={errors.profile_photo}
                                            />
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <Button className="cursor-pointer"
                                    disabled={processing}
                                    data-test="update-profile-button"
                                >
                                    Save
                                </Button>
                            </div>
                        </>
                    )}
                </Form>
            </div>

            {/* Validate Email */}
            <div className="space-y-4">
                <Heading
                    variant="small"
                    title="Validate Email"
                    description="Confirm your email address to receive email notifications."
                />

                <div className="flex items-end gap-4">
                    <div className="max-w-md flex-1">
                        <Label htmlFor="validate_email">Email address</Label>
                        <Input
                            id="validate_email"
                            readOnly
                            value={auth.user.email}
                            className="mt-1 block w-full bg-muted cursor-not-allowed"
                        />
                    </div>

                    {auth.user.email_verified_at !== null ? (
                        <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800 dark:bg-green-900/30 dark:text-green-400">
                            Validated
                        </span>
                    ) : (
                        <Button
                            onClick={() => {
                                setSending(true);
                                router.post(send(), {}, {
                                    preserveScroll: true,
                                    onFinish: () => setSending(false),
                                });
                            }}
                            disabled={sending}
                            variant="secondary"
                            data-test="validate-email-button"
                        >
                            {sending ? 'Sending...' : 'Validate'}
                        </Button>
                    )}
                </div>

                {validationErrors?.email && (
                    <InputError className="mt-1" message={validationErrors.email} />
                )}

                {status === 'verification-link-sent' && (
                    <p className="text-sm text-muted-foreground">
                        A validation link has been sent to{' '}
                        <span className="font-medium">{auth.user.email}</span>.
                        Open your inbox and click the link to confirm your email address.
                    </p>
                )}
            </div>

            <DeleteUser />
        </>
    );
}

Profile.layout = {
    breadcrumbs: [
        {
            title: 'Profile settings',
            href: edit(),
        },
    ],
};
