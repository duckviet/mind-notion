// Toolbar/index.tsx
import React, { useRef, useMemo } from "react";
import { motion } from "framer-motion";
import { Editor } from "@tiptap/react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useUploadMedia } from "@/shared/services/generated/api";
import ToolbarButton from "./ToolbarButton";
import { ToolbarConfigProps, ToolbarGroup } from "./ToolbarConfig";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "../../ui/hover-card";

interface ToolbarProps {
  editor: Editor;
  className?: string;
  getConfig?: (props: ToolbarConfigProps) => ToolbarGroup[];
  /** Flat index of the selected item (for keyboard nav) */
  selectedIndex?: number;
  /** Layout direction */
  direction?: "horizontal" | "vertical";
}

const Toolbar = ({
  editor,
  className,
  getConfig,
  selectedIndex,
  direction = "horizontal",
}: ToolbarProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { mutateAsync: uploadMedia, isPending: isUploading } = useUploadMedia({
    mutation: { onError: () => toast.error("Failed to upload image") },
  });

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) {
      if (file) toast.error("Please select an image file");
      return;
    }

    const toastId = toast.loading("Uploading image...");
    try {
      const res = await uploadMedia({ data: { file } });
      editor.chain().focus().setImage({ src: res.url, alt: file.name }).run();
      toast.success("Image uploaded", { id: toastId });
    } catch {
      toast.error("Failed to upload image", { id: toastId });
    } finally {
      event.target.value = "";
    }
  };

  const groups = useMemo(
    () =>
      getConfig
        ? getConfig({
            editor,
            options: {
              onAddImage: () => fileInputRef.current?.click(),
              onAddDrawing: () => editor.commands.insertDrawing(),
            },
          })
        : [],
    [editor, getConfig],
  );

  // Flatten items to map selectedIndex → specific item
  const flatItems = useMemo(() => groups.flatMap((g) => g.items), [groups]);

  let flatIdx = 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex border border-border items-center gap-1 p-1 z-999 bg-surface-50 text-text-primary rounded-md shadow-lg",
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
                    <HoverCard key={itemIdx}>
                      <HoverCardTrigger className="mt-1">
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
                      </HoverCardTrigger>
                      <HoverCardContent className="bg-surface-50 flex gap-2 flex-col border-none p-1">
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
                      </HoverCardContent>
                    </HoverCard>
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
                    ? "h-px w-full bg-gray-300 my-1"
                    : "w-px h-6 bg-gray-300 mx-1",
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
