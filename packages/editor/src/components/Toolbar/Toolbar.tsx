import React, { useRef, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Editor } from "@tiptap/react";
import { cn } from "../../utils/cn";
import ToolbarButton from "./ToolbarButton";
import { ToolbarConfigProps, ToolbarGroup } from "./types";

interface ToolbarProps {
  editor: Editor;
  className?: string;
  getConfig?: (props: ToolbarConfigProps) => ToolbarGroup[];
  /** Flat index of the selected item (for keyboard nav) */
  selectedIndex?: number;
  /** Layout direction */
  direction?: "horizontal" | "vertical";
  /** Note ID forwarded to layout-aware toolbar items */
  noteId?: string;
  /** Upload handler */
  onUploadImage?: (file: File) => Promise<void>;
  /** External loading state */
  isUploading?: boolean;
  createComment?: (input: { noteId: string; content: string }) => Promise<string | { id?: string } | null | undefined>;
}

const Toolbar = ({
  editor,
  className,
  getConfig,
  selectedIndex,
  direction = "horizontal",
  noteId,
  onUploadImage,
  isUploading = false,
  createComment,
}: ToolbarProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeHoverItem, setActiveHoverItem] = useState<number | null>(null);

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) {
      return;
    }

    try {
      if (onUploadImage) {
        await onUploadImage(file);
      } else {
        // Fallback or warning
        console.warn("No onUploadImage handler provided to Toolbar");
      }
    } finally {
      if (event.target.value) event.target.value = "";
    }
  };

  const groups = useMemo(
    () =>
      getConfig
        ? getConfig({
          editor,
          options: {
            onAddImage: () => fileInputRef.current?.click(),
            onAddDrawing: () => (editor.commands as any).insertDrawing?.(),
            noteId,
            createComment,
          },
        })
        : [],
    [createComment, editor, getConfig, noteId],
  );

  let flatIdx = 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "z-[999] flex items-center gap-1 rounded-md border border-border bg-surface-50 p-1 text-text-primary shadow-lg",
        direction === "vertical" ? "flex-col w-56" : "flex-wrap",
        className,
      )}
    >
      {groups.map((group, groupIdx) => {
        return (
          <React.Fragment key={group.name}>
            <div
              className={cn(
                "flex items-center gap-1",
                direction === "vertical" && "flex-col w-full",
              )}
            >
              {group.items.map((item, itemIdx) => {
                const currentFlatIdx = flatIdx++;
                const isSelected = selectedIndex === currentFlatIdx;

                if (item.isDropdown && item.DropdownNode) {
                  return (
                    <div key={itemIdx} className={cn(isSelected && " rounded")}>
                      {item.DropdownNode}
                    </div>
                  );
                }

                if (item.isPopover && item.PopoverNode) {
                  return (
                    <div key={itemIdx} className={cn(isSelected && " rounded")}>
                      {item.PopoverNode}
                    </div>
                  );
                }

                if (item.variants && item.variants.length > 0) {
                  return (
                    <div
                      key={itemIdx}
                      className="relative"
                      onMouseEnter={() => setActiveHoverItem(currentFlatIdx)}
                      onMouseLeave={() => setActiveHoverItem(null)}
                    >
                      <ToolbarButton
                        onClick={item.onClick}
                        isActive={item.isActive() || isSelected}
                        disabled={
                          item.disabled?.() ||
                          (item.tooltip === "Add Image" && isUploading)
                        }
                        icon={item.icon}
                        label={
                          direction === "vertical" ? item.tooltip : item.label
                        }
                        tooltip={
                          direction === "horizontal" ? item.tooltip : ""
                        }
                      />
                      <AnimatePresence>
                        {activeHoverItem === currentFlatIdx && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 5 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 5 }}
                            className="absolute left-0 top-full z-[1001] mt-1 flex flex-col gap-2 rounded-md border border-border bg-surface-50 p-1 shadow-xl"
                          >
                            {item.variants.map((variant, variantIdx) => (
                              <ToolbarButton
                                key={variantIdx}
                                onClick={variant.onClick}
                                isActive={variant.isActive()}
                                disabled={variant.disabled?.()}
                                icon={variant.icon}
                                label={variant.label}
                                tooltip={variant.tooltip}
                              />
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                }

                return (
                  <ToolbarButton
                    key={itemIdx}
                    onClick={item.onClick}
                    isActive={item.isActive() || isSelected}
                    disabled={
                      item.disabled?.() ||
                      (item.tooltip === "Add Image" && isUploading)
                    }
                    icon={item.icon}
                    label={direction === "vertical" ? item.tooltip : item.label}
                    tooltip={direction === "horizontal" ? item.tooltip : ""}
                  />
                );
              })}
            </div>
            {groupIdx < groups.length - 1 && (
              <div
                className={cn(
                  direction === "vertical"
                    ? "my-1 h-px w-full bg-border"
                    : "mx-1 h-6 w-px bg-border",
                )}
              />
            )}
          </React.Fragment>
        );
      })}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </motion.div>
  );
};

export default Toolbar;
export { Toolbar };
