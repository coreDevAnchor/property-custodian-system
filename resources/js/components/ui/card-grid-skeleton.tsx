export function CardGridSkeleton({
    count = 8,
    gridClass = 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
}: {
    count?: number;
    gridClass?: string;
}) {
    return (
        <div className={gridClass}>
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                    <div className="h-40 w-full animate-pulse rounded-none bg-muted" />
                    <div className="flex flex-col gap-3 p-4">
                        <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
                        <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
                        <div className="mt-2 h-9 w-full animate-pulse rounded-xl bg-muted" />
                    </div>
                </div>
            ))}
        </div>
    );
}
