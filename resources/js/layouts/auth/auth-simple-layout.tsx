import AppLogoIcon from '@/components/app-logo-icon';
import type { AuthLayoutProps } from '@/types';

export default function AuthSimpleLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    return (
        /* Full-screen light blue-gray background */
        <div className="flex min-h-svh flex-col items-center justify-center bg-[#e8ecf4] p-6 md:p-10">
            {/* White card */}
            <div className="w-full max-w-sm rounded-2xl bg-white px-8 py-10 shadow-md">
                <div className="flex flex-col gap-6">
                    {/* Brand header */}
                    <div className="flex flex-col items-center gap-3">
                        {/* Teal rounded icon box */}
                        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#0d7a5f] shadow-sm">
                            <AppLogoIcon className="size-8 fill-white" />
                        </div>

                        <div className="space-y-1 text-center">
                            <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">
                                {title}
                            </h1>
                            <p className="text-sm text-gray-400">
                                {description}
                            </p>
                        </div>
                    </div>

                    {/* Page content (form) */}
                    {children}
                </div>
            </div>
        </div>
    );
}
