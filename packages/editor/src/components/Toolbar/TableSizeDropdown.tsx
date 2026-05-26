import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Table } from "lucide-react";
import { Editor } from "@tiptap/react";
import { cn } from "../../utils/cn";

const MAX_ROWS = 10;
const MAX_COLS = 10;

export default function TableSizeDropdown({ editor }: { editor: Editor }) {
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredCell, setHoveredCell] = useState<{
    row: number;
    col: number;
  } | null>(null);

  const handleInsertTable = (rows: number, cols: number) => {
    if (rows > 0 && cols > 0) {
      editor
        .chain()
        .focus()
        .insertTable({ rows, cols, withHeaderRow: true })
        .run();
      setIsOpen(false);
      setHoveredCell(null);
    }
  };

  const renderGrid = () => {
    const cells = [];
    for (let row = 1; row <= MAX_ROWS; row++) {
      for (let col = 1; col <= MAX_COLS; col++) {
        const isHighlighted =
          hoveredCell && row <= hoveredCell.row && col <= hoveredCell.col;
        cells.push(
          <div
            key={`${row}-${col}`}
            className={cn(
              "w-4 h-4 border border-border cursor-pointer transition-colors rounded-[4px]",
              isHighlighted
                ? "bg-brand-600"
                : "bg-surface hover:bg-surface-hover",
            )}
            onMouseEnter={() => setHoveredCell({ row, col })}
            onClick={() => handleInsertTable(row, col)}
          />,
        );
      }
    }
    return cells;
  };

  return (
    <div className="relative">
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        title="Insert Table"
        className={cn(
          " items-center justify-center rounded p-1 transition-colors hover:bg-surface-hover hover:text-text-primary",
          isOpen && "bg-brand-600 text-primary-foreground",
        )}
      >
        <Table size={16} />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 top-full z-50 mt-2 rounded-lg border border-border bg-surface p-3 shadow-lg"
            onMouseLeave={() => setHoveredCell(null)}
          >
            <div
              className="grid gap-[2px] mb-2"
              style={{
                gridTemplateColumns: `repeat(${MAX_COLS}, 1fr)`,
              }}
            >
              {renderGrid()}
            </div>
            <div className="text-center text-xs font-medium text-text-secondary">
              {hoveredCell
                ? `${hoveredCell.row} × ${hoveredCell.col}`
                : "Select table size"}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
