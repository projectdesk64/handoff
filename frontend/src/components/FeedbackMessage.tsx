import { motion, useReducedMotion } from 'framer-motion';
import { ReactNode } from 'react';

interface FeedbackMessageProps {
    children: ReactNode;
    type?: 'success' | 'error' | 'info' | 'warning';
    className?: string;
}

export const FeedbackMessage = ({ children, type = 'info', className = '' }: FeedbackMessageProps) => {
    const shouldReduceMotion = useReducedMotion();

    const colors = {
        success: 'text-success',
        error: 'text-destructive',
        info: 'text-muted-foreground',
        warning: 'text-warning'
    };

    return (
        <motion.p
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 2 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className={`text-xs font-medium mt-1.5 ${colors[type]} ${className}`}
        >
            {children}
        </motion.p>
    );
};
