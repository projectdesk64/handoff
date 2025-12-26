import { motion, useReducedMotion, Variants } from 'framer-motion';
import { ReactNode } from 'react';

interface ExpandCollapseProps {
    children: ReactNode;
    className?: string;
}

export const ExpandCollapse = ({ children, className }: ExpandCollapseProps) => {
    const shouldReduceMotion = useReducedMotion();

    const variants: Variants = {
        enter: {
            height: "auto",
            opacity: 1,
            y: 0,
            transition: {
                duration: shouldReduceMotion ? 0 : 0.2,
                ease: "easeOut"
            }
        },
        exit: {
            height: 0,
            opacity: 0,
            y: -4,
            transition: {
                duration: shouldReduceMotion ? 0 : 0.2,
                ease: "easeOut"
            }
        }
    };

    return (
        <motion.div
            layout
            initial={shouldReduceMotion ? false : { height: 0, opacity: 0, y: -4 }}
            animate="enter"
            exit="exit"
            variants={variants}
            className={`overflow-hidden ${className || ''}`}
        >
            {children}
        </motion.div>
    );
};
