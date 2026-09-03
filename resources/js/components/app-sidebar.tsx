import { Link, router, usePage } from '@inertiajs/react';
import {
    BarChart3,
    BookOpen,
    Box,
    ClipboardList,
    LayoutDashboard,
    LogOut,
    RefreshCcw,
    Settings,
    Users,
    History,
    PackageSearch,
    BoxSelect,
} from 'lucide-react';
import * as reports from '@/actions/App/Http/Controllers/Custodian/ReportController';
import AppLogo from '@/components/app-logo';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import ThemeToggle from '@/components/themetoggle/theme-toggle';
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
import { logout } from '@/routes';
import { dashboard } from '@/routes/custodian';
import * as activity from '@/routes/custodian/activity';
import assets from '@/routes/custodian/assets/index';
import * as borrowRequests from '@/routes/custodian/borrow-requests';
import * as custodians from '@/routes/custodian/custodians';

import * as employees from '@/routes/custodian/employees';
import * as returns from '@/routes/custodian/returns';
import * as availableAssets from '@/routes/employee/assets';
import * as currentBorrows from '@/routes/employee/current-borrows';

import type { NavItem, SharedData } from '@/types';

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
            title: 'Borrow Assets',
            href: availableAssets.index.url(),
            icon: PackageSearch,
        },
        {
            title: 'My Current Borrows',
            href: currentBorrows.index.url(),
            icon: BoxSelect,
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
            href: reports.index.url(),
            icon: BarChart3,
        },
    ];

    const bottomNavItems: NavItem[] = [
        {
            title: 'Documentation',
            href: '/documentation',
            icon: BookOpen,
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
