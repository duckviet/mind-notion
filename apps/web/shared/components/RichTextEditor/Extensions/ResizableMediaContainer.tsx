import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type ResizeDirection = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

type DimensionValue = number | string | null | undefined;

export type ResizeDimensions = {
  width: string;
  height: string;
};

export type ResizeResult = {
  width: number;
  height: number;
  widthPx: string;
  heightPx: string;
};

type ResizeHandleConfig = {
  direction: ResizeDirection;
  className: string;
};

type ResizableMediaContainerProps = {
  width?: DimensionValue;
  height?: DimensionValue;
  selected: boolean;
  isEditable: boolean;
  minWidth?: number;
  minHeight?: number;
  keepAspectRatioOnCorner?: boolean;
  className?: string;
  selectedClassName?: string;
  resizeHandleClassName?: string;
  style?: React.CSSProperties;
  onResize?: (dimensions: ResizeDimensions) => void;
  onResizeEnd: (result: ResizeResult) => void;
  children: React.ReactNode;
};

const RESIZE_HANDLES: ResizeHandleConfig[] = [
  {
    direction: "nw",
    className:
      "absolute top-0 left-0 h-3 w-3 cursor-nwse-resize -translate-x-1/2 -translate-y-1/2 rounded-full border",
  },
  {
    direction: "ne",
    className:
      "absolute top-0 right-0 h-3 w-3 cursor-nesw-resize translate-x-1/2 -translate-y-1/2 rounded-full border",
  },
  {
    direction: "sw",
    className:
      "absolute bottom-0 left-0 h-3 w-3 cursor-nesw-resize -translate-x-1/2 translate-y-1/2 rounded-full border",
  },
  {
    direction: "se",
    className:
      "absolute bottom-0 right-0 h-3 w-3 cursor-nwse-resize translate-x-1/2 translate-y-1/2 rounded-full border",
  },
  {
    direction: "w",
    className:
      "absolute top-1/2 left-0 h-6 w-2 cursor-ew-resize -translate-x-1/2 -translate-y-1/2 rounded-r border",
  },
  {
    direction: "e",
    className:
      "absolute top-1/2 right-0 h-6 w-2 cursor-ew-resize translate-x-1/2 -translate-y-1/2 rounded-l border",
  },
  {
    direction: "n",
    className:
      "absolute top-0 left-1/2 h-2 w-6 cursor-ns-resize -translate-x-1/2 -translate-y-1/2 rounded-b border",
  },
  {
    direction: "s",
    className:
      "absolute bottom-0 left-1/2 h-2 w-6 cursor-ns-resize -translate-x-1/2 translate-y-1/2 rounded-t border",
  },
];

const toCssDimension = (value: DimensionValue, fallback: string) => {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return `${Math.round(value)}px`;
  }

  if (typeof value === "string" && value.trim()) {
    return value;
  }

  return fallback;
};

const ResizableMediaContainer: React.FC<ResizableMediaContainerProps> = ({
  width,
  height,
  selected,
  isEditable,
  minWidth = 50,
  minHeight = 50,
  keepAspectRatioOnCorner = true,
  className,
  selectedClassName = "ring-2 ring-blue-500 rounded",
  resizeHandleClassName = "bg-blue-500 border-white",
  style,
  onResize,
  onResizeEnd,
  children,
}) => {
  const [isResizing, setIsResizing] = useState(false);
  const [dimensions, setDimensions] = useState<ResizeDimensions>(() => ({
    width: toCssDimension(width, "auto"),
    height: toCssDimension(height, "auto"),
  }));

  useEffect(() => {
    setDimensions({
      width: toCssDimension(width, "auto"),
      height: toCssDimension(height, "auto"),
    });
  }, [width, height]);

  const startResize = (
    event: React.MouseEvent<HTMLDivElement>,
    direction: ResizeDirection,
  ) => {
    if (!isEditable) return;

    event.preventDefault();
    event.stopPropagation();

    const target = event.currentTarget.parentElement;
    if (!target) return;

    const startX = event.clientX;
    const startY = event.clientY;
    const startWidth = target.offsetWidth;
    const startHeight = target.offsetHeight;

    if (startWidth <= 0 || startHeight <= 0) {
      return;
    }

    setIsResizing(true);

    let currentWidth = startWidth;
    let currentHeight = startHeight;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;

      let newWidth = startWidth;
      let newHeight = startHeight;

      if (direction.includes("e")) {
        newWidth = Math.max(minWidth, startWidth + deltaX);
      }
      if (direction.includes("w")) {
        newWidth = Math.max(minWidth, startWidth - deltaX);
      }
      if (direction.includes("s")) {
        newHeight = Math.max(minHeight, startHeight + deltaY);
      }
      if (direction.includes("n")) {
        newHeight = Math.max(minHeight, startHeight - deltaY);
      }

      if (
        keepAspectRatioOnCorner &&
        direction.length === 2 &&
        startHeight > 0
      ) {
        const aspectRatio = startWidth / startHeight;
        newHeight = newWidth / aspectRatio;
      }

      newWidth = Math.round(newWidth);
      newHeight = Math.round(newHeight);

      currentWidth = newWidth;
      currentHeight = newHeight;

      const nextDimensions = {
        width: `${newWidth}px`,
        height: `${newHeight}px`,
      };

      setDimensions(nextDimensions);
      onResize?.(nextDimensions);
    };

    const handleMouseUp = () => {
      setIsResizing(false);

      onResizeEnd({
        width: currentWidth,
        height: currentHeight,
        widthPx: `${currentWidth}px`,
        heightPx: `${currentHeight}px`,
      });

      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  return (
    <div
      className={cn(
        "relative inline-block group m-2",
        selected && selectedClassName,
        className,
      )}
      style={{
        ...style,
        width: dimensions.width,
        height: dimensions.height,
      }}
    >
      {children}

      {selected && isEditable && (
        <>
          {RESIZE_HANDLES.map((handle) => (
            <div
              key={handle.direction}
              className={cn(
                handle.className,
                "pointer-events-none opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100",
                resizeHandleClassName,
              )}
              onMouseDown={(event) => startResize(event, handle.direction)}
            />
          ))}
        </>
      )}

      {isResizing && (
        <div className="pointer-events-none absolute bottom-2 right-2 rounded bg-black/70 px-2 py-1 text-xs text-white">
          {dimensions.width} x {dimensions.height}
        </div>
      )}
    </div>
  );
};

export default ResizableMediaContainer;
