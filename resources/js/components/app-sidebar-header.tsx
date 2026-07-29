import { Link, usePage } from '@inertiajs/react';
import { Bell } from 'lucide-react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { SidebarTrigger } from '@/components/ui/sidebar';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import * as notifications from '@/routes/notifications';
import type { BreadcrumbItem as BreadcrumbItemType, SharedData } from '@/types';

export function AppSidebarHeader({
    breadcrumbs = [],
}: {
    breadcrumbs?: BreadcrumbItemType[];
}) {
    const { unreadNotificationCount } = usePage<SharedData>().props;
    const notificationLabel = unreadNotificationCount > 0
        ? `Notifications (${unreadNotificationCount} unread)`
        : 'Notifications';

    return (
        <header className="flex h-16 shrink-0 items-center gap-2 border-b border-sidebar-border/50 px-6 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 md:px-4">
            <div className="flex items-center gap-2">
                <SidebarTrigger className="-ml-1" />
                <Breadcrumbs breadcrumbs={breadcrumbs} />
            </div>
            <div className="ml-auto">
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Link
                            href={notifications.index.url()}
                            prefetch
                            aria-label={notificationLabel}
                            className="relative inline-flex size-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                            <Bell className="size-5" />
                            {unreadNotificationCount > 0 && (
                                <span className="absolute -top-1 -right-1 flex min-w-4 h-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold leading-none text-white">
                                    {unreadNotificationCount > 99 ? '99+' : unreadNotificationCount}
                                </span>
                            )}
                        </Link>
                    </TooltipTrigger>
                    <TooltipContent>{notificationLabel}</TooltipContent>
                </Tooltip>
            </div>
        </header>
    );
}
