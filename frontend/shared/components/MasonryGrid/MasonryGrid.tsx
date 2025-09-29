import React, { useEffect, useRef, useState } from "react";
import Card from "../CardComponent/Card";
import { CardSkeleton, NoteCard } from "../CardComponent";

type Props = {
  data: {
    result: any;
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
      const gap = parseInt(computedStyle.gap || "16"); // Default to 16px if gap is not set

      // Calculate current column count based on grid template columns
      const currentColumnCount =
        computedStyle.gridTemplateColumns.split(" ").length;
      setColumnCount(currentColumnCount);

      // Reset all margins first
      items.forEach((item) => {
        item.style.marginTop = "0";
      });

      // Apply margins starting from second row
      items.forEach((item, index) => {
        if (index < currentColumnCount) return;

        const itemRect = item.getBoundingClientRect();
        const aboveItem = items[index - currentColumnCount];
        const aboveRect = aboveItem.getBoundingClientRect();

        // Calculate the actual space needed
        const desiredSpace = gap;
        const currentSpace = itemRect.top - aboveRect.bottom;
        const adjustment = desiredSpace - currentSpace;

        if (adjustment !== 0) {
          const currentMargin = parseInt(item.style.marginTop || "0");
          item.style.marginTop = `${currentMargin + adjustment}px`;
        }
      });
    };

    // Initial layout
    updateLayout();

    // Create a ResizeObserver to handle grid changes
    const resizeObserver = new ResizeObserver(() => {
      updateLayout();
    });

    resizeObserver.observe(gridRef.current);

    // Cleanup
    return () => {
      resizeObserver.disconnect();
    };
  }, [data]);

  return (
    <div className="w-full h-full relative ">
      <div
        ref={gridRef}
        className="grid gap-4 auto-rows-auto grid-cols-3 md:grid-cols-4 "
        // style={{
        //   gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))`,
        // }}
      >
        {/* Add Note Card */}
        <NoteCard />

        {/* Render Data Cards */}
        {isLoading && (
          <>
            {Array.from({ length: 4 }).map((_, index) => (
              <CardSkeleton key={`skeleton-${index}`} index={index} />
            ))}
          </>
        )}
        {!isLoading &&
          data.result.map((result: any, index: any) => (
            <Card
              key={result.id || index}
              match={result}
              onDelete={handleDelete}
            />
          ))}
      </div>
    </div>
  );
}
