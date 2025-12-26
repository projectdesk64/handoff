import { motion, useReducedMotion } from 'motion/react';
import { ReactNode } from 'react';

interface PageTransitionProps {
    children: ReactNode;
}

export function PageTransition({ children }: PageTransitionProps) {
    const shouldReduceMotion = useReducedMotion();

    const variants = {
        initial: {
            opacity: 0,
            y: 8
        },
        enter: {
            opacity: 1,
            y: 0
        },
        exit: {
            opacity: 0,
            y: -8
        }
    };

    const transition = {
        duration: 0.25,
        ease: "easeOut" as const
    };

    if (shouldReduceMotion) {
        return <>{children}</>;
    }

    return (
        <motion.div
            initial="initial"
            animate="enter"
            exit="exit"
            variants={variants}
            transition={transition}
            className="w-full"
        >
            {children}
        </motion.div>
    );
}
