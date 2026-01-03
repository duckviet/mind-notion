import React, { useRef, useMemo } from "react";
import { motion } from "framer-motion";
import { Editor } from "@tiptap/react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useUploadMedia } from "@/shared/services/generated/api";
import ToolbarButton from "./ToolbarButton";
import TableSizeDropdown from "./TableSizeDropdown";
import { getToolbarGroups } from "./ToolbarConfig";

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
    event: React.ChangeEvent<HTMLInputElement>
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
    [editor]
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex flex-wrap items-center gap-1 p-2 bg-gray-50 rounded-lg border border-gray-200 sticky -top-4 z-15 shadow-md",
        className
      )}
    >
      {groups.map((group, groupIdx) => (
        <React.Fragment key={group.name}>
          <div className="flex items-center gap-1">
            {group.items.map((item, itemIdx) =>
              item.isDropdown ? (
                <TableSizeDropdown key={itemIdx} editor={editor} />
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
              )
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
