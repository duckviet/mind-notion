import React from "react";
import { AnimatePresence, motion } from "framer-motion";

type AnimateCardProviderProps = {
  children: React.ReactNode;
  /**
   * Should be true if the children are conditionally rendered (enter/exit).
   * If false, children are always present (just animated in).
   */
  presence?: boolean;
  /**
   * Animation variants for card motion.div, or fallback default.
   */
  variants?: any;
};

/**
 * Provides animation for Card-like elements, eg with AnimatePresence and framer-motion.
 *
 * Example:
 * <AnimateCardProvider presence>
 *   <motion.div key={note.id}>
 *     {...}
 *   </motion.div>
 * </AnimateCardProvider>
 */
export function AnimateCardProvider({
  children,
  presence = false,
  variants,
}: AnimateCardProviderProps) {
  const defaultVariants = {
    hidden: {
      opacity: 0,
      y: 20,
      scale: 1,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.3,
        ease: "easeOut",
      },
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      y: -10,
      transition: {
        duration: 0.3,
        ease: "easeInOut",
      },
    },
  };

  if (presence) {
    return (
      <>
        {React.Children.map(children, (child: any) => {
          if (!React.isValidElement(child)) return null;
          return React.cloneElement(child, {
            variants: variants ?? defaultVariants,
            initial: "hidden",
            animate: "visible",
            exit: "exit",
            layout: "true",
          } as any);
        })}
      </>
    );
  }

  // Just animate in (no AnimatePresence needed)
  return (
    <>
      {React.Children.map(children, (child: any) => {
        if (!React.isValidElement(child)) return null;
        return React.cloneElement(child, {
          variants: variants ?? defaultVariants,
          initial: "hidden",
          animate: "visible",
          layout: "true",
        } as any);
      })}
    </>
  );
}
