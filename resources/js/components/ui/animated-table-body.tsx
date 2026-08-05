import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { tableVariants } from "@/components/assets/asset-table-animations";
import { TableSkeleton } from "./table-skeleton";

interface AnimatedTableBodyProps {
    loading: boolean;
    animate: boolean;
    animationKey: string;
    children: React.ReactNode;
}

export function AnimatedTableBody({
    loading,
    animate,
    animationKey,
    children,
}: AnimatedTableBodyProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        if (loading) return;

        const id = setTimeout(() => setMounted(true), 300);

        return () => clearTimeout(id);
    }, [loading]);

    if (!mounted) {
        return <TableSkeleton rows={10} />;
    }

    if (!animate) {
        return <tbody>{children}</tbody>;
    }

    return (
        <motion.tbody
            key={animationKey}
            variants={tableVariants}
            initial="hidden"
            animate="show"
        >
            {children}
        </motion.tbody>
    );
}