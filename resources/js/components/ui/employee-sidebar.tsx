import { Link, router } from '@inertiajs/react';
import { LogOut, PackageSearch, Undo2 } from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarSeparator,
} from '@/components/ui/sidebar';

import * as availableAssets from '@/routes/employee/assets';
import * as myBorrows from '@/routes/employee/borrows';

import { logout } from '@/routes';
import type { NavItem } from '@/types';
import ThemeToggle from '@/components/themetoggle/theme-toggle';

const mainNavItems: NavItem[] = [
    {
        title: 'Available Assets',
        href: availableAssets.index.url(),
        icon: PackageSearch,
    },
    {
        title: 'My Borrow History',
        href: myBorrows.index.url(),
        icon: Undo2,
    },
];

export function EmployeeSidebar() {
    const handleLogout = () => {
        router.post(logout.url());
    };

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={availableAssets.index.url()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>

                <ThemeToggle />
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} label="Employee" />
            </SidebarContent>

            <SidebarFooter>
                <SidebarSeparator />

                {/* Log Out */}
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            onClick={handleLogout}
                            className="cursor-pointer"
                            tooltip={{ children: 'Log Out' }}
                        >
                            <LogOut className="size-4" />
                            <span>Log Out</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>

                <SidebarSeparator />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}