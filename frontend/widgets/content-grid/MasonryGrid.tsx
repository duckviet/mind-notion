import React, { Fragment, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import NoteCard from "@/entities/note/ui/NoteCard";
import ArticleCard from "@/entities/web-article/ui/ArticleCard";
import AddNoteForm from "@/features/add-note/ui/AddNoteForm";
import CardSkeleton from "@/shared/components/CardSkeleton";

type Props = {
  data: {
    result: any[];
  };
  isLoading?: boolean;
  handleDelete: (id?: string) => Promise<void>;
};

export default function MasonryGrid({ data, isLoading, handleDelete }: Props) {
  const gridRef = useRef<HTMLDivElement>(null);
  const [columnCount, setColumnCount] = useState(4);

  useEffect(() => {
    if (!gridRef.current) return;

    const updateLayout = () => {
      const grid = gridRef.current!;
      const items = Array.from(grid.children) as HTMLElement[];
      const computedStyle = getComputedStyle(grid);
      const gap = parseInt(computedStyle.gap || "16");

      const currentColumnCount =
        computedStyle.gridTemplateColumns.split(" ").length;
      setColumnCount(currentColumnCount);

      items.forEach((item) => {
        item.style.marginTop = "0";
      });

      items.forEach((item, index) => {
        if (index < currentColumnCount) return;

        const itemRect = item.getBoundingClientRect();
        const aboveItem = items[index - currentColumnCount];
        const aboveRect = aboveItem.getBoundingClientRect();

        const desiredSpace = gap;
        const currentSpace = itemRect.top - aboveRect.bottom;
        const adjustment = desiredSpace - currentSpace;

        if (adjustment !== 0) {
          const currentMargin = parseInt(item.style.marginTop || "0");
          item.style.marginTop = `${currentMargin + adjustment}px`;
        }
      });
    };

    updateLayout();
    const resizeObserver = new ResizeObserver(() => updateLayout());
    resizeObserver.observe(gridRef.current);

    return () => resizeObserver.disconnect();
  }, [data]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="w-full relative">
      <motion.div
        ref={gridRef}
        className="grid gap-6 auto-rows-auto grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div
          variants={itemVariants}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <AddNoteForm />
        </motion.div>

        <AnimatePresence>
          {isLoading ? (
            <Fragment>
              {Array.from({ length: 8 }).map((_, index) => (
                <motion.div
                  key={`skeleton-${index}`}
                  variants={itemVariants}
                  className="h-fit"
                  transition={{ duration: 0.4, ease: "easeOut" }}
                >
                  <CardSkeleton index={index} />
                </motion.div>
              ))}
            </Fragment>
          ) : (
            data.result.map((result: any) => {
              const cardProps = {
                match: result,
                onDelete: handleDelete,
              };
              return (
                <motion.div
                  key={result.id}
                  variants={itemVariants}
                  layout
                  className="h-fit"
                  transition={{ duration: 0.4, ease: "easeOut" }}
                >
                  {result.metadata.type === "note" ? (
                    <NoteCard {...cardProps} />
                  ) : (
                    <ArticleCard {...cardProps} />
                  )}
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
