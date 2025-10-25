// MasonryGrid.tsx
import React, { Fragment, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type MasonryGridProps = {
  data: any[];
  children: React.ReactNode;
  className?: string;
  columnCount?: number;
  gap?: number;
  isLoading?: boolean;
  layoutAnimation?: boolean;
};

export default function MasonryGrid({
  data,
  children,
  className = "",
  columnCount: providedColumnCount,
  gap = 6,
  isLoading = false,
  layoutAnimation = false,
}: MasonryGridProps) {
  const gridRef = useRef<HTMLDivElement>(null);
  const [columnCount, setColumnCount] = useState(4);

  // CSS columns approach - no manual layout needed
  useEffect(() => {
    if (!gridRef.current) return;

    const updateColumnCount = () => {
      const grid = gridRef.current!;
      const computedStyle = getComputedStyle(grid);
      const currentColumnCount = parseInt(computedStyle.columnCount) || 1;
      setColumnCount(currentColumnCount);
    };

    const resizeObserver = new ResizeObserver(() => {
      updateColumnCount();
    });

    if (gridRef.current) {
      resizeObserver.observe(gridRef.current);
      updateColumnCount();
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [data.length, data]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 },
    },
  };

  return (
    <div className="w-full relative">
      <motion.div
        ref={gridRef}
        className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6"
        style={{
          columnGap: "24px",
          columnFill: "balance",
        }}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {isLoading ? (
          React.Children.map(children, (child: any) =>
            React.isValidElement(child) ? child : null
          )
        ) : (
          <AnimatePresence mode="popLayout">{children}</AnimatePresence>
        )}
      </motion.div>
    </div>
  );
}
