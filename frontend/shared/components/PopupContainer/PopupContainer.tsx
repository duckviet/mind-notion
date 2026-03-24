import { forwardRef } from "react";
import { cn } from "@/lib/utils";

interface PopupContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  x?: number;
  y?: number;
  children: React.ReactNode;
}

const PopupContainer = forwardRef<HTMLDivElement, PopupContainerProps>(
  ({ x, y, children, className, ...props }, ref) => {
    // Nếu có x, y thì dùng absolute/fixed positioning (cho Hover Popups)
    const isPositioned = x !== undefined && y !== undefined;

    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center gap-1 rounded-lg border border-border bg-surface px-2 py-1 shadow-lg",
          isPositioned && "fixed z-[9999]",
          className,
        )}
        style={
          isPositioned
            ? { left: x, top: y, transform: "translateX(-50%)" }
            : undefined
        }
        {...props}
      >
        {children}
      </div>
    );
  },
);

PopupContainer.displayName = "PopupContainer";

export default PopupContainer;
