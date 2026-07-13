import { Link, router, usePage } from '@inertiajs/react';
import {
    BarChart3,
    Box,
    ClipboardList,
    LayoutDashboard,
    LogOut,
    RefreshCcw,
    Settings,
    Users,
    History,
} from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import * as custodians from '@/routes/custodian/custodians';
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
import * as activity from '@/routes/custodian/activity';

import { logout } from '@/routes';
import type { NavItem, SharedData } from '@/types';
import ThemeToggle from '@/components/themetoggle/theme-toggle';

export function AppSidebar() {
    const { props } = usePage<SharedData>();
    const counts = props.counts;

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
            badge: counts?.pendingBorrowRequests ?? 0,
        },
        {
            title: 'Returns',
            href: returns.index.url(),
            icon: RefreshCcw,
            badge: counts?.awaitingReturns ?? 0,
        },
        {
            title: 'Employees',
            href: employees.index.url(),
            icon: Users,
        },
        {
            title: 'Custodians',
            href: custodians.index.url(),
            icon: Users,
        },
        {
            title: 'Audit Trail',
            href: activity.index.url(),
            icon: History,
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