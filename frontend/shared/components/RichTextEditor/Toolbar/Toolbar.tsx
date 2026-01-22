import React, { useRef, useMemo } from "react";
import { motion } from "framer-motion";
import { Editor } from "@tiptap/react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useUploadMedia } from "@/shared/services/generated/api";
import ToolbarButton from "./ToolbarButton";
import TableSizeDropdown from "./TableSizeDropdown";
import { getToolbarGroups } from "./ToolbarConfig";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "../../ui/hover-card";

const Toolbar = ({
  editor,
  className,
}: {
  editor: Editor;
  className?: string;
}) => {
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

  // Khởi tạo các groups thông qua useMemo
  const groups = useMemo(
    () =>
      getToolbarGroups(editor, {
        onAddImage: () => fileInputRef.current?.click(),
      }),
    [editor],
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex flex-wrap border border-border items-center gap-1 p-2 bg-surface-50 text-text-primary rounded-lg   shadow-md",
        className,
      )}
    >
      {groups.map((group, groupIdx) => (
        <React.Fragment key={group.name}>
          <div className="flex items-center gap-1">
            {group.items.map((item, itemIdx) =>
              item.isDropdown ? (
                <TableSizeDropdown key={itemIdx} editor={editor} />
              ) : (
                <React.Fragment key={itemIdx}>
                  {item.variants && item.variants.length > 0 ? (
                    <HoverCard>
                      <HoverCardTrigger asChild>
                        <div className="inline-block cursor-pointer">
                          {" "}
                          <ToolbarButton
                            key={itemIdx}
                            onClick={item.onClick}
                            isActive={item.isActive()}
                            disabled={
                              item.disabled?.() ||
                              (item.tooltip === "Add Image" && isUploading)
                            }
                            icon={item.icon}
                            tooltip={""}
                          />
                        </div>
                      </HoverCardTrigger>
                      <HoverCardContent className="bg-white flex gap-2 flex-col border-none p-2">
                        {item?.variants?.map((variant, variantIdx) => (
                          <ToolbarButton
                            key={variantIdx}
                            onClick={variant.onClick}
                            isActive={variant.isActive()}
                            disabled={
                              variant.disabled?.() ||
                              (variant.tooltip === "Add Image" && isUploading)
                            }
                            icon={variant.icon}
                            label={variant.label}
                            tooltip={variant.tooltip}
                          />
                        ))}
                      </HoverCardContent>
                    </HoverCard>
                  ) : (
                    <ToolbarButton
                      key={itemIdx}
                      onClick={item.onClick}
                      isActive={item.isActive()}
                      disabled={
                        item.disabled?.() ||
                        (item.tooltip === "Add Image" && isUploading)
                      }
                      icon={item.icon}
                      tooltip={item.tooltip}
                    />
                  )}
                </React.Fragment>
              ),
            )}
          </div>
          {groupIdx < groups.length - 1 && (
            <div className="w-px h-6 bg-gray-300 mx-1" />
          )}
        </React.Fragment>
      ))}

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
