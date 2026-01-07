import { motion } from "framer-motion";
import React from "react";
export type ToolbarButtonProps = {
  onClick: () => void;
  isActive: boolean;
  icon: React.ReactNode;
  tooltip: string;
  disabled?: boolean;
  label?: string;
};

export default function ToolbarButton({
  onClick,
  isActive,
  icon,
  tooltip,
  disabled = false,
  label,
}: ToolbarButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : label ? 1 : 1.1 }}
      whileTap={{ scale: disabled ? 1 : 0.95 }}
      onClick={onClick}
      disabled={disabled}
      title={tooltip}
      className={`p-2 rounded inline-flex items-center space-x-2 transition-colors ${
        isActive && !label
          ? "bg-[#a55252] text-white"
          : disabled
            ? "text-gray-300 cursor-not-allowed"
            : "text-gray-700 hover:bg-gray-200"
      }`}
    >
      {icon}
      {label && <span className="text-sm">{label}</span>}
    </motion.button>
  );
}
