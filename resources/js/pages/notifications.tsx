import { Head, router } from '@inertiajs/react';
import {
    Bell,
    BellRing,
    CalendarClock,
    CheckCheck,
    Clock3,
    MailOpen,
    MoreHorizontal,
    Trash2,
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PaginationBar } from '@/components/ui/pagination';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import * as notificationRoutes from '@/routes/notifications';
import type { Paginated } from '@/types/pagination';

type NotificationItem = {
    id: string;
    type: 'return_reminder' | 'deadline_reminder' | string;
    title: string;
    message: string;
    asset_name: string | null;
    asset_tag: string | null;
    due_date: string | null;
    read_at: string | null;
    created_at: string;
};

type Props = {
    notifications: Paginated<NotificationItem>;
    unreadCount: number;
};

function formatDate(value: string) {
    return new Intl.DateTimeFormat('en-PH', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    }).format(new Date(value));
}

function formatMobileDate(value: string) {
    const date = new Date(value);

    const datePart = new Intl.DateTimeFormat('en-PH', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    }).format(date);

    const timePart = new Intl.DateTimeFormat('en-PH', {
        hour: 'numeric',
        minute: '2-digit',
    }).format(date);

    return `${datePart} • ${timePart}`;
}

export default function Notifications({ notifications, unreadCount }: Props) {
    const [details, setDetails] = useState<NotificationItem | null>(null);

    function markAsRead(id: string) {
        router.patch(
            notificationRoutes.read.url(id),
            {},
            {
                preserveScroll: true,
                only: [
                    'notifications',
                    'unreadCount',
                    'unreadNotificationCount',
                ],
            },
        );
    }

    function markAsUnread(id: string) {
        router.patch(
            notificationRoutes.unread.url(id),
            {},
            {
                preserveScroll: true,
                only: [
                    'notifications',
                    'unreadCount',
                    'unreadNotificationCount',
                ],
            },
        );
    }

    function markAllAsRead() {
        router.patch(
            notificationRoutes.readAll.url(),
            {},
            {
                preserveScroll: true,
                only: [
                    'notifications',
                    'unreadCount',
                    'unreadNotificationCount',
                ],
            },
        );
    }

    function deleteNotification(id: string) {
        setDetails(null);
        router.delete(notificationRoutes.destroy.url(id), {
            preserveScroll: true,
            only: ['notifications', 'unreadCount', 'unreadNotificationCount'],
        });
    }

    function deleteReadNotifications() {
        router.delete(notificationRoutes.destroyRead.url(), {
            preserveScroll: true,
            only: ['notifications', 'unreadCount', 'unreadNotificationCount'],
        });
    }

    function fetchPage(page: number, perPage = notifications.per_page) {
        router.get(
            notificationRoutes.index.url({
                query: { page, per_page: perPage },
            }),
            {},
            {
                preserveScroll: true,
                preserveState: true,
                only: [
                    'notifications',
                    'unreadCount',
                    'unreadNotificationCount',
                ],
            },
        );
    }

    function changePage(page: number) {
        if (page >= 1 && page <= notifications.last_page) {
            fetchPage(page);
        }
    }

    function changePerPage(perPage: number) {
        fetchPage(1, perPage);
    }

    const hasReadNotifications = notifications.data.some(
        (notification) => notification.read_at !== null,
    );

    return (
        <>
            <Head title="Notifications" />

            <div className="flex h-full flex-1 flex-col gap-6 p-6 lg:p-8">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <div className="flex items-center gap-3">
                            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                <BellRing className="size-5" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
                                    Notifications
                                </h1>
                                <p className="text-sm text-muted-foreground">
                                    Return-date reminders for assigned assets
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {unreadCount > 0 && (
                            <Button variant="outline" onClick={markAllAsRead}>
                                <CheckCheck className="size-4 cursor-pointer" />
                                Mark all as read
                            </Button>
                        )}
                    </div>
                </div>

                <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                    {notifications.data.length === 0 ? (
                        <div className="flex flex-col items-center justify-center gap-3 px-6 py-20 text-center">
                            <div className="flex size-14 items-center justify-center rounded-2xl bg-muted">
                                <Bell className="size-7 text-muted-foreground" />
                            </div>
                            <div>
                                <p className="font-semibold text-foreground">
                                    You’re all caught up
                                </p>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    New return reminders will appear here.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="divide-y divide-border">
                            {notifications.data.map((notification) => {
                                const isDueToday =
                                    notification.type === 'deadline_reminder';
                                const Icon = isDueToday
                                    ? Clock3
                                    : CalendarClock;

                                return (
                                    <article
                                        key={notification.id}
                                        className={`${notification.read_at ? 'bg-card' : 'bg-primary/[0.035]'}`}
                                    >
                                        {/* ── Desktop layout ── */}
                                        <div className="hidden items-start gap-4 px-5 py-4 sm:px-6 md:flex">
                                            <div
                                                className={`mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl ${isDueToday ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'}`}
                                            >
                                                <Icon className="size-5" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex flex-col gap-1">
                                                    <p className="font-semibold text-foreground">
                                                        {notification.title}
                                                    </p>
                                                </div>
                                                <p className="mt-1 text-sm whitespace-pre-line text-muted-foreground">
                                                    {notification.message}
                                                </p>
                                                {notification.asset_name && (
                                                    <p className="mt-2 text-xs font-medium text-foreground">
                                                        {notification.asset_name}
                                                        {notification.asset_tag
                                                            ? ` · ${notification.asset_tag}`
                                                            : ''}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="flex flex-col items-end gap-2">
                                                <time
                                                    className="text-xs text-muted-foreground"
                                                    dateTime={
                                                        notification.created_at
                                                    }
                                                >
                                                    {formatDate(
                                                        notification.created_at,
                                                    )}
                                                </time>

                                                {!notification.read_at ? (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() =>
                                                            markAsRead(
                                                                notification.id,
                                                            )
                                                        }
                                                    >
                                                        Mark read
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() =>
                                                            markAsUnread(
                                                                notification.id,
                                                            )
                                                        }
                                                    >
                                                        Mark unread
                                                    </Button>
                                                )}
                                            </div>
                                        </div>

                                        {/* ── Mobile layout ── */}
                                        <div className="md:hidden">
                                            <div className="flex items-start gap-3 p-4">
                                                <div
                                                    className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${isDueToday ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'}`}
                                                >
                                                    <Icon className="size-5" />
                                                </div>

                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate font-semibold text-foreground">
                                                        {notification.title}
                                                    </p>
                                                    <time
                                                        className="mt-0.5 block text-xs text-muted-foreground"
                                                        dateTime={
                                                            notification.created_at
                                                        }
                                                    >
                                                        {formatMobileDate(
                                                            notification.created_at,
                                                        )}
                                                    </time>
                                                </div>

                                                <DropdownMenu>
                                                    <DropdownMenuTrigger
                                                        asChild
                                                    >
                                                        <button
                                                            type="button"
                                                            className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                                            aria-label={`Actions for ${notification.title}`}
                                                        >
                                                            <MoreHorizontal className="size-5" />
                                                        </button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent
                                                        align="end"
                                                        className="w-48"
                                                    >
                                                        {notification.read_at ? (
                                                            <DropdownMenuItem
                                                                onSelect={() =>
                                                                    markAsUnread(
                                                                        notification.id,
                                                                    )
                                                                }
                                                            >
                                                                <MailOpen />
                                                                Mark as unread
                                                            </DropdownMenuItem>
                                                        ) : (
                                                            <DropdownMenuItem
                                                                onSelect={() =>
                                                                    markAsRead(
                                                                        notification.id,
                                                                    )
                                                                }
                                                            >
                                                                <CheckCheck />
                                                                Mark as read
                                                            </DropdownMenuItem>
                                                        )}
                                                        <DropdownMenuItem
                                                            variant="destructive"
                                                            onSelect={() =>
                                                                deleteNotification(
                                                                    notification.id,
                                                                )
                                                            }
                                                        >
                                                            <Trash2 />
                                                            Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>

                                            <div className="border-t border-border px-4 pt-3 pb-4">
                                                <p className="text-sm whitespace-pre-line text-muted-foreground">
                                                    {notification.message}
                                                </p>
                                                {notification.asset_name && (
                                                    <p className="mt-2 text-xs font-medium text-foreground">
                                                        {notification.asset_name}
                                                        {notification.asset_tag
                                                            ? ` · ${notification.asset_tag}`
                                                            : ''}
                                                    </p>
                                                )}
                                            </div>

                                            <div className="flex items-center justify-between gap-2 border-t border-border px-4 py-3">
                                                {notification.read_at ? (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() =>
                                                            markAsUnread(
                                                                notification.id,
                                                            )
                                                        }
                                                    >
                                                        Mark unread
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() =>
                                                            markAsRead(
                                                                notification.id,
                                                            )
                                                        }
                                                    >
                                                        Mark read
                                                    </Button>
                                                )}

                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() =>
                                                        setDetails(notification)
                                                    }
                                                >
                                                    View Details
                                                </Button>
                                            </div>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    )}

                    {notifications.last_page > 1 && (
                        <PaginationBar
                            currentPage={notifications.current_page}
                            lastPage={notifications.last_page}
                            total={notifications.total}
                            from={notifications.from}
                            to={notifications.to}
                            perPage={notifications.per_page}
                            itemLabel="notifications"
                            onPageChange={changePage}
                            onPerPageChange={changePerPage}
                        />
                    )}
                </div>
            </div>

            {/* ── Mobile detail sheet ── */}
            <Sheet
                open={details !== null}
                onOpenChange={(open) => !open && setDetails(null)}
            >
                <SheetContent side="bottom" className="sm:hidden">
                    {details && (
                        <>
                            <SheetHeader>
                                <SheetTitle>{details.title}</SheetTitle>
                                <SheetDescription>
                                    <time dateTime={details.created_at}>
                                        {formatMobileDate(details.created_at)}
                                    </time>
                                </SheetDescription>
                            </SheetHeader>

                            <div className="px-4">
                                <p className="text-sm whitespace-pre-line text-muted-foreground">
                                    {details.message}
                                </p>
                                {details.asset_name && (
                                    <p className="mt-2 text-xs font-medium text-foreground">
                                        {details.asset_name}
                                        {details.asset_tag
                                            ? ` · ${details.asset_tag}`
                                            : ''}
                                    </p>
                                )}
                            </div>

                            <SheetFooter>
                                {details.read_at ? (
                                    <Button
                                        variant="outline"
                                        className="cursor-pointer"
                                        onClick={() =>
                                            markAsUnread(details.id)
                                        }
                                    >
                                        Mark unread
                                    </Button>
                                ) : (
                                    <Button
                                        variant="outline"
                                        className="cursor-pointer"
                                        onClick={() => markAsRead(details.id)}
                                    >
                                        Mark read
                                    </Button>
                                )}
                                <Button
                                    variant="destructive"
                                    className="cursor-pointer"
                                    onClick={() => deleteNotification(details.id)}
                                >
                                    <Trash2 />
                                    Delete
                                </Button>
                            </SheetFooter>
                        </>
                    )}
                </SheetContent>
            </Sheet>
        </>
    );
}