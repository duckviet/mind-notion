import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, ChevronLeft, ChevronRight, Printer } from "lucide-react";
import { useReactToPrint } from "react-to-print";
import { RichTextEditor } from "@/shared/components/RichTextEditor";
import { Button } from "@/shared/components/ui/button";
import NoteMetadataPanel from "./NoteMetadataPanel";
import NoteTagsSection from "./NoteTagsSection";
import CommentSection from "./CommentSection";
import { ResDetailNote } from "@/shared/services/generated/api";
import { cn } from "@/lib/utils";

interface FocusEditModalContentProps {
  form: {
    title: string;
    content: string;
    tags: string[];
  };
  newTag: string;
  error: string;
  isSaving: boolean;
  isSidebarCollapsed: boolean | null;
  titleRef: React.RefObject<HTMLInputElement | null>;
  note: ResDetailNote | undefined;
  onTitleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onContentChange: (value: string) => void;
  onNewTagChange: (value: string) => void;
  onTagAdd: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onTagRemove: (tag: string) => void;
  onToggleSidebar: () => void;
}

export default function FocusEditModalContent({
  form,
  newTag,
  error,
  isSaving,
  isSidebarCollapsed,
  titleRef,
  note,
  onTitleChange,
  onContentChange,
  onNewTagChange,
  onTagAdd,
  onTagRemove,
  onToggleSidebar,
}: FocusEditModalContentProps) {
  const contentRef = React.useRef<HTMLDivElement>(null);
  const reactToPrintFn = useReactToPrint({
    contentRef,
    documentTitle: form.title,
  });

  return (
    <div className="flex-1 flex overflow-hidden w-full gap-4 justify-center bg-[#f0f2f5] p-2 rounded-[16px]">
      <div className="flex-1 overflow-y-auto space-y-4 rounded-2xl bg-white w-full">
        <div className="p-6 pb-0">
          <input
            ref={titleRef}
            name="title"
            value={form.title}
            onChange={onTitleChange}
            placeholder="Your note title..."
            className="w-full text-4xl font-semibold text-black outline-none mb-3"
            maxLength={200}
          />
          {error && (
            <div className="flex items-center gap-2 text-red-600 text-sm mb-3">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}
        </div>
        <RichTextEditor
          showTOC={true}
          contentRef={contentRef}
          content={form.content}
          onUpdate={onContentChange}
          editable
        />
      </div>

      <motion.aside
        initial={false}
        animate={{ width: isSidebarCollapsed ? 50 : 320 }}
        transition={{ type: "spring", stiffness: 260, damping: 30 }}
        className="shrink-0 rounded-2xl p-2 flex flex-col bg-transparent overflow-auto"
      >
        <motion.div
          initial={false}
          transition={{ type: "spring", stiffness: 260, damping: 30 }}
          className={cn(
            "flex items-center justify-end gap-1",
            isSidebarCollapsed && "flex-col-reverse",
          )}
        >
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => reactToPrintFn()}
            aria-label="Print note"
          >
            <Printer className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onToggleSidebar}
            aria-label={
              isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"
            }
          >
            {isSidebarCollapsed ? (
              <ChevronLeft className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </Button>
        </motion.div>

        <AnimatePresence initial={false}>
          {!isSidebarCollapsed && (
            <motion.div
              key="sidebar-content"
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              transition={{ duration: 0.15 }}
              className="flex flex-col space-y-10 mt-4 min-w-0 mr-2"
            >
              {/* <NoteMetadataPanel note={note} /> */}
              <NoteTagsSection
                tags={form.tags}
                newTag={newTag}
                onNewTagChange={onNewTagChange}
                onTagAdd={onTagAdd}
                onTagRemove={onTagRemove}
                disabled={isSaving}
              />
              {note?.id && <CommentSection noteId={note.id} />}
              <div className="text-xs text-right mt-auto text-gray-500">
                {form.content.length} chars
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.aside>
    </div>
  );
}
