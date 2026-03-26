'use client';

import { motion, type Variants } from 'framer-motion';
import { forwardRef, type ComponentPropsWithoutRef } from 'react';

// Re-export hooks and components from framer-motion
export { useReducedMotion, AnimatePresence } from 'framer-motion';

// Import for internal use
import { useReducedMotion } from 'framer-motion';

// Helper to get animation props respecting reduced motion preference
export function getMotionProps(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return {
      initial: false,
      animate: { opacity: 1 },
      exit: { opacity: 0 },
      transition: { duration: 0.01 },
    };
  }
  return {};
}

// Animation variants for common patterns
export const fadeInOut: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

export const slideUp: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 20 },
};

export const slideDown: Variants = {
  initial: { opacity: 0, y: -20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

export const scaleIn: Variants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
};

export const modalVariants: Variants = {
  initial: { opacity: 0, scale: 0.95, y: 10 },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.2, ease: 'easeOut' }
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 10,
    transition: { duration: 0.15, ease: 'easeIn' }
  },
};

export const backdropVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

// Stagger children animation for lists
export const staggerContainer: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.05,
    },
  },
};

export const staggerItem: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.2 }
  },
};

// Reusable motion components
export const MotionDiv = motion.div;
export const MotionButton = motion.button;
export const MotionLi = motion.li;
export const MotionUl = motion.ul;
export const MotionSpan = motion.span;
export const MotionSection = motion.section;
export const MotionArticle = motion.article;

// Animated list wrapper
interface AnimatedListProps extends ComponentPropsWithoutRef<typeof motion.ul> {
  children: React.ReactNode;
}

export const AnimatedList = forwardRef<HTMLUListElement, AnimatedListProps>(
  ({ children, ...props }, ref) => (
    <motion.ul
      ref={ref}
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      {...props}
    >
      {children}
    </motion.ul>
  )
);
AnimatedList.displayName = 'AnimatedList';

// Animated list item
interface AnimatedListItemProps extends ComponentPropsWithoutRef<typeof motion.li> {
  children: React.ReactNode;
}

export const AnimatedListItem = forwardRef<HTMLLIElement, AnimatedListItemProps>(
  ({ children, ...props }, ref) => (
    <motion.li
      ref={ref}
      variants={staggerItem}
      {...props}
    >
      {children}
    </motion.li>
  )
);
AnimatedListItem.displayName = 'AnimatedListItem';

// Fade in wrapper for page content (respects reduced motion)
interface FadeInProps extends ComponentPropsWithoutRef<typeof motion.div> {
  children: React.ReactNode;
  delay?: number;
}

export const FadeIn = forwardRef<HTMLDivElement, FadeInProps>(
  ({ children, delay = 0, ...props }, ref) => {
    const shouldReduceMotion = useReducedMotion();

    return (
      <motion.div
        ref={ref}
        initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: shouldReduceMotion ? 0.01 : 0.3, delay: shouldReduceMotion ? 0 : delay }}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);
FadeIn.displayName = 'FadeIn';

