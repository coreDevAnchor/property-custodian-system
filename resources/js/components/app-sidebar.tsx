import { Link, router } from '@inertiajs/react';
import {
    BarChart3,
    Box,
    ClipboardList,
    LayoutDashboard,
    LogOut,
    RefreshCcw,
    Settings,
    Users,
} from 'lucide-react';
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
import { dashboard } from '@/routes/custodian';

import assets from '@/routes/custodian/assets/index';
import * as borrowRequests from '@/routes/custodian/borrow-requests';
import * as employees from '@/routes/custodian/employees';
import * as returns from '@/routes/custodian/returns';

import { logout } from '@/routes';
import type { NavItem } from '@/types';
import ThemeToggle from "@/components/themetoggle/theme-toggle";

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
        icon: LayoutDashboard,
    },
    {
        title: 'Assets',
        href: assets.index.url(),
        icon: Box,
    },
    {
        title: 'Borrow Requests',
        href: borrowRequests.index.url(),
        icon: ClipboardList,
        badge: 12,
    },
    {
        title: 'Returns',
        href: returns.index.url(),
        icon: RefreshCcw,
        badge: 5,
    },
    {
        title: 'Employees',
        href: employees.index.url(),
        icon: Users,
    },
    {
        title: 'Reports',
        href: '#',
        icon: BarChart3,
    },
];

const bottomNavItems: NavItem[] = [
    {
        title: 'Settings',
        href: '#',
        icon: Settings,
    },
];

export function AppSidebar() {
    const handleLogout = () => {
        router.post(logout.url());
    };

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>

                <ThemeToggle />
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} label="Custodian" />
            </SidebarContent>

            <SidebarFooter>
                <SidebarSeparator />
                <NavMain items={bottomNavItems} />

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