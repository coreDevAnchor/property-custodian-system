import { Link } from '@inertiajs/react';
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { useCurrentUrl } from '@/hooks/use-current-url';
import type { NavItem } from '@/types';

export function NavMain({ items = [], label }: { items: NavItem[]; label?: string }) {
    const { isCurrentUrl } = useCurrentUrl();

    return (
        <SidebarGroup className="px-2 py-0">
            {label && (
                <SidebarGroupLabel
                    className="
                        text-xs font-semibold uppercase tracking-widest
                        text-black/40
                        dark:text-white/40
                    "
                >
                    {label}
                </SidebarGroupLabel>
            )}

            <SidebarMenu>
                {items.map((item) => (
                    <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                            asChild
                            isActive={isCurrentUrl(item.href)}
                            tooltip={{ children: item.title }}
                            className="
                                group relative
                                text-black/70
                                hover:bg-black/5
                                hover:text-black

                                dark:text-white/70
                                dark:hover:bg-white/10
                                dark:hover:text-white

                                data-[active=true]:bg-primary
                                data-[active=true]:text-primary-foreground
                            "
                        >
                            <Link href={item.href} prefetch>
                                {item.icon && <item.icon className="size-4 shrink-0" />}
                                <span className="flex-1">{item.title}</span>

                                {item.badge !== undefined && item.badge > 0 && (
                                    <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-orange-500 px-1.5 text-[10px] font-bold leading-none text-white">
                                        {item.badge}
                                    </span>
                                )}
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                ))}
            </SidebarMenu>
        </SidebarGroup>
    );
}