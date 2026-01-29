import React, { useMemo } from "react";
import { Editor } from "@tiptap/react";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/components/ui/popover";
import { Textarea } from "@/shared/components/ui/textarea";
import { Button } from "@/shared/components/ui/button";
import ToolbarButton from "./ToolbarButton";
import { getBubbleToolbarConfigs } from "./ToolbarConfig";
import { useNoteComment } from "../hooks/useNoteComment";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquareMoreIcon } from "lucide-react";

type CommentPopoverProps = {
  editor: Editor;
  className?: string;
};

const CommentPopover = ({ editor, className }: CommentPopoverProps) => {
  const noteId = editor.view.dom.getAttribute("data-note-id") || "";
  const {
    isOpen,
    setIsOpen,
    content,
    setContent,
    submitComment,
    isSubmitting,
  } = useNoteComment(editor, noteId);

  const canComment = !editor.state.selection.empty;

  return (
    <div className="relative">
      <motion.button
        // whileHover={{ scale: 1.1 }}
        // whileTap={{ scale: 0.95 }}
        onClick={submitComment}
        title="Insert Table"
        className={cn(
          "p-2 rounded transition-colors flex items-center gap-2 text-sm hover:text-primary-foreground hover:bg-accent-foreground/40",
        )}
      >
        <MessageSquareMoreIcon size={14} /> Comment
      </motion.button>

      {/* <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 mt-2 bg-accent border border-border rounded-lg shadow-lg p-3 z-50"
          ></motion.div>
        )}
      </AnimatePresence> */}
    </div>
  );
};

export default CommentPopover;
