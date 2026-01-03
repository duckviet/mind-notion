import { motion } from "framer-motion";
import React from "react";
export type ToolbarButtonProps = {
  onClick: () => void;
  isActive: boolean;
  icon: React.ReactNode;
  tooltip: string;
  disabled?: boolean;
};

export default function ToolbarButton({
  onClick,
  isActive,
  icon,
  tooltip,
  disabled = false,
}: ToolbarButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.1 }}
      whileTap={{ scale: disabled ? 1 : 0.95 }}
      onClick={onClick}
      disabled={disabled}
      title={tooltip}
      className={`p-2 rounded transition-colors ${
        isActive
          ? "bg-[#a55252] text-white"
          : disabled
            ? "text-gray-300 cursor-not-allowed"
            : "text-gray-700 hover:bg-gray-200"
      }`}
    >
      {icon}
    </motion.button>
  );
}
