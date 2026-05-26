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
        whileHover={{ y: -2, scale: 1 }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 20,
          opacity: { duration: 0.3 },
          y: { duration: 0.2 },
        }}
        className={cn(
          "relative",
          "bg-card flex flex-col w-full cursor-pointer outline-none focus:outline-none",
          "rounded-md shadow-none focus:ring-2 focus:ring-ring/20 focus:ring-offset-2 focus:ring-offset-background",
          "transition-all duration-200 ease-out",
          className,
        )}
        tabIndex={0}
        {...props}
      >
        {children}
      </motion.div>
    );
  },
);

Card.displayName = "Card";

export { Card };
