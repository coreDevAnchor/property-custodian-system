import AppLogoIcon from '@/components/app-logo-icon';

export default function AppLogo() {
    return (
        <>
            <div className="flex aspect-square size-8 items-center justify-center rounded-md bg-[#0d7a5f] text-sidebar-primary-foreground">
                <AppLogoIcon className="size-5 fill-white" />
            </div>
            <div className="ml-1 grid flex-1 text-left text-sm">
                <span className="truncate leading-tight font-bold text-white">
                    coreDev
                </span>
            </div>
        </>
    );
}
