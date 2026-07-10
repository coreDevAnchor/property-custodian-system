import type { ReactNode } from 'react';
import type { BreadcrumbItem } from '@/types/navigation';

export type AppLayoutProps = {
    children: ReactNode;
    breadcrumbs?: BreadcrumbItem[];
};

export interface User {
    id: number;
    name: string;
    email: string;
    role: 'custodian' | 'employee';
    email_verified_at?: string | null;
}

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
