import { motion } from 'framer-motion';
import { sectionVariants } from '@/components/assets/asset-table-animations';

interface SectionRevealProps {
    children: React.ReactNode;
    className?: string;
}

export function SectionReveal({ children, className }: SectionRevealProps) {
    return (
        <motion.div variants={sectionVariants} className={className}>
            {children}
        </motion.div>
    );
}
