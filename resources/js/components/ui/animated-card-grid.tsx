import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { cardGridVariants } from "@/components/assets/asset-table-animations";
import { CardGridSkeleton } from "./card-grid-skeleton";

interface AnimatedCardGridProps {
    loading: boolean;
    animate: boolean;
    animationKey: string;
    gridClass?: string;
    children: React.ReactNode;
}

export function AnimatedCardGrid({
    loading,
    animate,
    animationKey,
    gridClass = 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
    children,
}: AnimatedCardGridProps) {
    const [mounted, setMounted] = useState(!loading);

    useEffect(() => {
        if (loading) {
            setMounted(false);
            return;
        }

        const frame = requestAnimationFrame(() => setMounted(true));

        return () => cancelAnimationFrame(frame);
    }, [loading, animationKey]);

    if (loading || !mounted) {
        return <CardGridSkeleton gridClass={gridClass} />;
    }

    if (!animate) {
        return <div className={gridClass}>{children}</div>;
    }

    return (
        <motion.div
            key={animationKey}
            className={gridClass}
            variants={cardGridVariants}
            initial="hidden"
            animate="show"
        >
            {children}
        </motion.div>
    );
}
