import type { Variants } from 'framer-motion';

export const tableVariants: Variants = {
    hidden: {},
    show: {
        transition: {
            staggerChildren: 0.045,
        },
    },
};

export const rowVariants: Variants = {
    hidden: {
        opacity: 0,
        x: -20,
    },

    show: {
        opacity: 1,
        x: 0,
        transition: {
            duration: 0.22,
        },
    },
};

export const pageStaggerVariants: Variants = {
    hidden: {},
    show: {
        transition: {
            staggerChildren: 0.12,
        },
    },
};

export const sectionVariants: Variants = {
    hidden: {
        opacity: 0,
        y: 32,
    },

    show: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.45,
            ease: 'easeOut',
        },
    },
};

export const cardGridVariants: Variants = {
    hidden: {},
    show: {
        transition: {
            staggerChildren: 0.08,
        },
    },
};

export const cardVariants: Variants = {
    hidden: {
        opacity: 0,
        y: 24,
    },

    show: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.35,
        },
    },
};
