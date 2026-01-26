import React from "react";
import type { Editor } from "@tiptap/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Printer,
  Share2,
} from "lucide-react";
import { useReactToPrint } from "react-to-print";
import { RichTextEditor } from "@/shared/components/RichTextEditor";
import type { CollaborationConfig } from "@/shared/components/RichTextEditor/useTiptapEditor";
import { Button } from "@/shared/components/ui/button";
import NoteMetadataPanel from "./NoteMetadataPanel";
import NoteTagsSection from "./NoteTagsSection";
import CommentSection from "./CommentSection";
import { ShareNoteModal } from "./ShareNoteModal";
import { ResDetailNote } from "@/shared/services/generated/api";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/shared/components/ui/skeleton";

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
  // note: ResDetailNote | undefined;
  noteId: string | undefined;
  isPublic: boolean | undefined;
  onTitleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onContentChange: (value: string) => void;
  onNewTagChange: (value: string) => void;
  onTagAdd: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onTagRemove: (tag: string) => void;
  onToggleSidebar: () => void;
  collaboration?: CollaborationConfig;
  readOnlyMeta?: boolean;
  showShareActions?: boolean;
  showComments?: boolean;
  onEditorReady?: (editor: Editor) => void;
  showEditor?: boolean;
}

export default function FocusEditModalContent({
  form,
  newTag,
  error,
  isSaving,
  isSidebarCollapsed,
  titleRef,
  noteId,
  isPublic,
  onTitleChange,
  onContentChange,
  onNewTagChange,
  onTagAdd,
  onTagRemove,
  onToggleSidebar,
  collaboration,
  readOnlyMeta = false,
  showShareActions = true,
  showComments = true,
  onEditorReady,
  showEditor = true,
}: FocusEditModalContentProps) {
  const contentRef = React.useRef<HTMLDivElement>(null);
  const reactToPrintFn = useReactToPrint({
    contentRef,
    documentTitle: form.title,
  });

  const [isShareModalOpen, setIsShareModalOpen] = React.useState(false);

  return (
    <div className="flex-1 flex overflow-hidden w-full gap-4 justify-center   bg-surface-100 p-2 rounded-[16px]">
      <div className="flex-1 overflow-y-auto space-y-4 rounded-2xl  bg-card border border-border w-full">
        <div className="p-6 pb-0">
          <input
            ref={titleRef}
            name="title"
            value={form.title}
            onChange={onTitleChange}
            placeholder="Your note title..."
            className={cn(
              "w-full text-4xl font-semibold text-text-primary bg-transparent outline-none mb-3",
              readOnlyMeta && "opacity-70 cursor-not-allowed",
            )}
            maxLength={200}
            disabled={readOnlyMeta}
          />
          {error && (
            <div className="flex items-center gap-2 text-red-600 text-sm mb-3">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}
        </div>
        <RichTextEditor
          showEditor={showEditor}
          contentRef={contentRef}
          content={form.content}
          onUpdate={onContentChange}
          editable
          collaboration={collaboration}
          onEditorReady={onEditorReady}
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
          {showShareActions && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setIsShareModalOpen(true)}
              aria-label="Share note"
              className="hover:bg-hover-overlay"
            >
              <Share2 className="w-4 h-4" />
            </Button>
          )}

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => reactToPrintFn()}
            aria-label="Print note"
            className="hover:bg-hover-overlay"
          >
            <Printer className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="hover:bg-hover-overlay"
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
                disabled={isSaving || readOnlyMeta}
              />
              {showComments && noteId && <CommentSection noteId={noteId} />}
              <div className="text-xs text-right mt-auto text-gray-500">
                {form.content.length} chars
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.aside>

      {noteId && showShareActions && (
        <ShareNoteModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          noteId={noteId}
          isPublic={isPublic || false}
          title={form.title}
        />
      )}
    </div>
  );
}
