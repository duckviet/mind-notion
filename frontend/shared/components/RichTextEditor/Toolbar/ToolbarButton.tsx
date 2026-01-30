import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import React from "react";
export type ToolbarButtonProps = {
  onClick: () => void;
  isActive: boolean;
  icon: React.ReactNode;
  tooltip: string;
  disabled?: boolean;
  label?: string;
  className?: string;
};

export default function ToolbarButton({
  onClick,
  isActive,
  icon,
  tooltip,
  disabled = false,
  label,
  className,
}: ToolbarButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : label ? 1 : 1.1 }}
      whileTap={{ scale: disabled ? 1 : 0.95 }}
      onClick={onClick}
      disabled={disabled}
      title={tooltip}
      className={cn(
        "p-1 gap-2 rounded inline-flex items-center space-x-2 transition-colors text-sm",
        className,
        isActive && !label
          ? "bg-[#a55252] text-white"
          : disabled
            ? "cursor-not-allowed"
            : "hover:bg-accent-foreground/40 hover:text-primary-foreground",
      )}
    >
      {icon}
      {label}
    </motion.button>
  );
}
