import { Variants } from "framer-motion";

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