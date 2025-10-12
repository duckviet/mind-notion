import React from "react";
import { motion } from "framer-motion";
import { Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface FloatingActionButtonProps {
  isOpen?: boolean;
  onToggle?: () => void;
  className?: string;
}

export default function FloatingActionButton({
  isOpen = false,
  onToggle,
  className,
}: FloatingActionButtonProps) {
  return (
    <motion.button
      className={cn(
        "fixed bottom-6 right-6 w-14 h-14 rounded-full",
        "glass-bg shadow-glass-lg border-glass-border",
        "flex items-center justify-center",
        "focus:outline-none focus:ring-2 focus:ring-accent-blue focus:ring-offset-2",
        "transition-all duration-200 ease-out",
        className
      )}
      whileHover={{
        scale: 1.05,
        rotate: isOpen ? 0 : 90,
        boxShadow: "0 8px 32px rgba(102, 126, 234, 0.25)",
      }}
      whileTap={{ scale: 0.95 }}
      onClick={onToggle}
      aria-label={isOpen ? "Close add menu" : "Open add menu"}
      role="button"
      tabIndex={0}
    >
      <motion.div
        animate={{ rotate: isOpen ? 45 : 0 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
      >
        {isOpen ? (
          <X className="w-6 h-6 text-text-primary" />
        ) : (
          <Plus className="w-6 h-6 text-text-primary" />
        )}
      </motion.div>
    </motion.button>
  );
}
