export function TableSkeleton({
    rows = 10,
}: {
    rows?: number;
}) {
    return (
        <tbody>
            {Array.from({ length: rows }).map((_, i) => (
                <tr key={i} className="border-b">
                    {[...Array(6)].map((_, j) => (
                        <td
                            key={j}
                            className="py-4"
                        >
                            <div className="h-4 w-full animate-pulse rounded bg-muted" />
                        </td>
                    ))}
                </tr>
            ))}
        </tbody>
    );
}