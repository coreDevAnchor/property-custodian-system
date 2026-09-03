import { motion } from "framer-motion";
import {
    ArrowRightLeft,
    Ban,
    CheckCircle2,
    ClipboardCheck,
    History,
    PackageMinus,
    PackagePlus,
    PackageX,
    Wrench,
    XCircle,
} from 'lucide-react';

import {
    tableVariants,
    rowVariants,
} from "@/components/assets/asset-table-animations";
import type { ActivityItem } from '@/types/activities';

const actionIcons: Record<string, typeof History> = {
    asset_created: PackagePlus,
    asset_updated: ArrowRightLeft,
    asset_deleted: PackageMinus,
    asset_disposed: PackageMinus,
    asset_repair_flagged: Wrench,
    asset_lost: PackageX,
    borrow_requested: ClipboardCheck,
    borrow_approved: CheckCircle2,
    borrow_rejected: XCircle,
    return_submitted: ArrowRightLeft,
    return_inspected: CheckCircle2,
};

const actionColors: Record<string, string> = {
    asset_created: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
    asset_updated: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    asset_deleted: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
    asset_disposed: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
    asset_repair_flagged: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
    asset_lost: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
    borrow_requested: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
    borrow_approved: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
    borrow_rejected: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
    return_submitted: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
    return_inspected: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
};

function timeAgo(dateString: string) {
    const date = new Date(dateString);
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

    if (seconds < 60) {
        return 'just now';
    }

    const minutes = Math.floor(seconds / 60);

    if (minutes < 60) {
        return `${minutes}m ago`;
    }

    const hours = Math.floor(minutes / 60);

    if (hours < 24) {
        return `${hours}h ago`;
    }

    const days = Math.floor(hours / 24);

    if (days < 7) {
        return `${days}d ago`;
    }

    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

export function ActivityFeed({
    items,
}: {
    items: ActivityItem[];
}) {
    if (items.length === 0) {
        return (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
                <History className="size-8 text-muted-foreground" />
                <p className="text-sm font-semibold text-foreground">No activity yet</p>
                <p className="text-xs text-muted-foreground">
                    Actions taken on assets will appear here
                </p>
            </div>
        );
    }

    return (
        <motion.div
            className="space-y-1"
            variants={tableVariants}
            initial="hidden"
            animate="show"
        >
            {items.map((item) => {
                const Icon = actionIcons[item.action] ?? History;
                const colorClass =
                    actionColors[item.action] ?? 'bg-muted text-muted-foreground';

                return (
                    <motion.div
                        key={item.id}
                        variants={rowVariants}
                        className="flex items-start gap-3 border-b border-border py-3 last:border-0"
                    >
                        <div
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${colorClass}`}
                        >
                            <Icon className="size-4" />
                        </div>

                        <div className="min-w-0 flex-1">
                            <p className="text-sm text-foreground">{item.description}</p>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                                {item.actor?.name && `${item.actor.name} · `}
                                {timeAgo(item.created_at)}
                            </p>
                        </div>
                    </motion.div>
                );
            })}
        </motion.div>
    );
}