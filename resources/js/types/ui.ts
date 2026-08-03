import type { ReactNode } from 'react';
import type { User } from '@/types/auth';
import type { BreadcrumbItem } from '@/types/navigation';

export type AppLayoutProps = {
    children: ReactNode;
    breadcrumbs?: BreadcrumbItem[];
};

export interface SharedData {
    name: string;
    auth: {
        user: User;
    };
    sidebarOpen: boolean;
    flash: {
        type: FlashToast['type'] | null;
        message: string | null;
    };
    counts: {
        pendingBorrowRequests: number;
        awaitingReturns: number;
    } | null;
    unreadNotificationCount: number;
    [key: string]: unknown;
}


export type AppVariant = 'header' | 'sidebar';

export type FlashToast = {
    type: 'success' | 'info' | 'warning' | 'error';
    message: string;
};

export type AuthLayoutProps = {
    children?: ReactNode;
    name?: string;
    title?: string;
    description?: string;
};
