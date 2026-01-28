import React from "react";
import type { Editor } from "@tiptap/react";
import { AlertCircle } from "lucide-react";
import { useReactToPrint } from "react-to-print";
import { RichTextEditor } from "@/shared/components/RichTextEditor";
import type { CollaborationConfig } from "@/shared/components/RichTextEditor/useTiptapEditor";
import { Button } from "@/shared/components/ui/button";
import { CollaborativeSidebar } from "@/shared/components/CollaborativeSidebar";
import { ShareNoteModal } from "./ShareNoteModal";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

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
  const router = useRouter();
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

      <CollaborativeSidebar
        isSidebarCollapsed={isSidebarCollapsed || false}
        onToggleSidebar={onToggleSidebar}
        tags={form.tags}
        newTag={newTag}
        onNewTagChange={onNewTagChange}
        onTagAdd={onTagAdd}
        onTagRemove={onTagRemove}
        tagsDisabled={isSaving || readOnlyMeta}
        showComments={showComments}
        noteId={noteId}
        showShareActions={showShareActions}
        onShareClick={() => setIsShareModalOpen(true)}
        showPrintAction
        onPrintClick={reactToPrintFn}
        showExpandAction
        onExpandClick={() => router.push(`/note/${noteId}/edit`)}
        contentLength={form.content.length}
        className="rounded-2xl p-6 bg-transparent"
      />

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
