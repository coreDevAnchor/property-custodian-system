import { Head } from '@inertiajs/react';
import { History } from 'lucide-react';
import { ActivityFeed } from '@/components/activity/activity-feed';
import { dashboard } from '@/routes/custodian';

interface ActivityItem {
    id: number;
    action: string;
    description: string;
    created_at: string;
    asset?: { id: number; name: string; asset_tag: string } | null;
    actor?: { id: number; name: string } | null;
}

interface Props {
    activity: {
        data: ActivityItem[];
    };
}

export default function AuditTrail({ activity }: Props) {
    return (
        <>
            <Head title="Audit Trail" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-6 lg:p-8">
                <div>
                    <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
                        Audit Trail
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        A complete, append-only record of everything that's happened
                    </p>
                </div>

                <div className="rounded-xl border border-border bg-card p-6 text-card-foreground shadow-sm">
                    <ActivityFeed items={activity?.data ?? []} />
                </div>
            </div>
        </>
    );
}

AuditTrail.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard() },
        { title: 'Audit Trail', href: '/custodian/activity' },
    ],
};