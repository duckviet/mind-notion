import React from "react";
import { motion } from "framer-motion";
import { cn } from "../../utils/cn";

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
        "p-1 gap-2 rounded inline-flex items-center space-x-2 transition-colors text-sm w-full text-nowrap",
        className,
        isActive && "bg-brand-600 text-primary-foreground",
        disabled && "cursor-not-allowed",
        !isActive &&
        !disabled &&
        "hover:bg-surface-hover hover:text-text-primary",
      )}
    >
      <div>{icon}</div>
      {label}
    </motion.button>
  );
}
