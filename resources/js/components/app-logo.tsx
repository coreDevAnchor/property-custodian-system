import AppLogoIcon from '@/components/app-logo-icon';

export default function AppLogo() {
    return (
        <>
            <div className="flex aspect-square size-8 items-center justify-center rounded-md bg-[#0d7a5f]">
                <AppLogoIcon className="size-5 fill-white" />
            </div>

            <div className="ml-1 grid flex-1 text-left text-sm">
                <span className="truncate font-bold leading-tight text-foreground">
                    coreDev
                </span>
            </div>
        </>
    );
}