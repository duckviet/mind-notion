import { cn } from "@/lib/utils";
import React from "react";
import { motion } from "framer-motion";

type CardProps = {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
};

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -2, scale: 1.02 }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 20,
          opacity: { duration: 0.3 },
          y: { duration: 0.2 },
        }}
        className={cn(
          "relative glass-bg glass-hover p-6 rounded-glass shadow-glass-md",
          "flex flex-col w-full cursor-pointer",
          // "focus:outline-none focus:ring-2 focus:ring-accent-blue focus:ring-offset-2",
          "transition-all duration-200 ease-out",
          className
        )}
        tabIndex={0}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

Card.displayName = "Card";

export { Card };
