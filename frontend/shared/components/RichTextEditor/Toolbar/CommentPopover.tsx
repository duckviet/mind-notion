import React, { useEffect, useRef } from "react";
import { Editor } from "@tiptap/react";
import { cn } from "@/lib/utils";
import { useNoteComment } from "../hooks/useNoteComment";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUpIcon, Loader2Icon, MessageSquareMoreIcon } from "lucide-react";
import { Textarea } from "../../ui/textarea";

type CommentPopoverProps = {
  editor: Editor;
  className?: string;
};

const CommentPopover = ({ editor, className }: CommentPopoverProps) => {
  const noteId = editor.view.dom.getAttribute("data-note-id") || "";
  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const { content, setContent, submitComment, isSubmitting } = useNoteComment(
    editor,
    noteId,
  );

  const canComment = !editor.state.selection.empty;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  useEffect(() => {
    if (!canComment && isOpen) setIsOpen(false);
  }, [canComment, isOpen]);

  const handleSubmit = async () => {
    await submitComment();
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && e.shiftKey) {
      e.preventDefault();
      if (canComment && !isSubmitting && content.trim() !== "") {
        handleSubmit();
      }
    }
  };

  return (
    <div className={cn("relative", className)} ref={containerRef}>
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 rounded px-2 py-1 text-sm transition-colors hover:bg-accent-foreground/40 hover:text-primary-foreground",
          isOpen && "bg-[#a55252] text-primary-foreground",
        )}
      >
        <MessageSquareMoreIcon size={14} /> Comment
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 top-full z-50 mt-4 rounded-lg border border-border bg-accent py-1 px-2 shadow-lg"
          >
            <div className="flex w-64 items-end gap-1">
              <Textarea
                className="max-h-[300px] min-h-[36px] flex-1 resize-none overflow-y-auto border-none bg-accent text-sm focus-visible:ring-1 focus-visible:ring-ring"
                autoFocus
                placeholder={
                  canComment
                    ? "Write your comment..."
                    : "Select text to add a comment"
                }
                onInput={(e) => {
                  e.currentTarget.style.height = "auto";
                  e.currentTarget.style.height =
                    e.currentTarget.scrollHeight + "px";
                }}
                value={content}
                onKeyDown={handleKeyDown}
                onChange={(e) => setContent(e.target.value)}
                disabled={!canComment || isSubmitting}
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSubmit}
                disabled={!canComment || isSubmitting || content.trim() === ""}
                className="mb-1 shrink-0 rounded-full bg-primary p-2 text-primary-foreground disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader2Icon size={12} className="animate-spin" />
                ) : (
                  <ArrowUpIcon size={12} />
                )}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CommentPopover;
