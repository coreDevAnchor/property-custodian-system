import AppLogoIcon from '@/components/app-logo-icon';
import type { AuthLayoutProps } from '@/types';

export default function AuthSimpleLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    return (
        <div
            className="
                flex min-h-screen items-center justify-center
                bg-[#e8ecf4] dark:bg-zinc-950
                p-6 md:p-10
                transition-colors
            "
        >
            <div
                className="
                    w-full max-w-sm
                    rounded-2xl
                    bg-white dark:bg-zinc-900
                    border border-gray-200 dark:border-zinc-800
                    shadow-md
                    px-8 py-10
                    transition-colors
                "
            >
                <div className="flex flex-col gap-6">
                    <div className="flex flex-col items-center gap-3">
                        <div className="flex h-14 w-14 items-center justify-center">
                            <AppLogoIcon className="size-14" />
                        </div>

                        <div className="space-y-1 text-center">
                            <h1 className="text-xl font-extrabold tracking-tight text-gray-900 dark:text-white">
                                {title}
                            </h1>

                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {description}
                            </p>
                        </div>
                    </div>

                    {children}
                </div>
            </div>
        </div>
    );
}