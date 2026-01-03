import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Table } from "lucide-react";
import { Editor } from "@tiptap/react";
import { cn } from "@/lib/utils";

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
              "w-4 h-4 border border-gray-300 cursor-pointer transition-colors rounded-sm",
              isHighlighted ? "bg-[#a55252]" : "bg-white hover:bg-gray-100"
            )}
            onMouseEnter={() => setHoveredCell({ row, col })}
            onClick={() => handleInsertTable(row, col)}
          />
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
          "p-2 rounded transition-colors",
          isOpen ? "bg-[#a55252] text-white" : "text-gray-700 hover:bg-gray-200"
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
            className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-50"
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
            <div className="text-xs text-gray-600 text-center font-medium">
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
