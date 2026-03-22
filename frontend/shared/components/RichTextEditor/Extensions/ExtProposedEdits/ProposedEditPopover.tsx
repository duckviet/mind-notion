import React, { useEffect, useRef } from "react";
import { Editor } from "@tiptap/react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUpIcon, FileEdit } from "lucide-react";
import { Textarea } from "../../../ui/textarea";

type ProposedEditPopoverProps = {
  editor: Editor;
  className?: string;
};

const ProposedEditPopover = ({
  editor,
  className,
}: ProposedEditPopoverProps) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [proposedText, setProposedText] = React.useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const savedSelectionRef = useRef<{ from: number; to: number } | null>(null);

  const canPropose = !editor.state.selection.empty;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  useEffect(() => {
    if (!canPropose && isOpen) {
      setIsOpen(false);
    }
  }, [canPropose, isOpen]);

  const handleOpen = () => {
    const before = editor.state.selection;

    if (!before.empty) {
      savedSelectionRef.current = { from: before.from, to: before.to };
    }

    editor.chain().focus().run();

    if (savedSelectionRef.current) {
      editor
        .chain()
        .focus()
        .setTextSelection({
          from: savedSelectionRef.current.from,
          to: savedSelectionRef.current.to,
        })
        .run();
    }

    if (savedSelectionRef.current && !editor.state.selection.empty) {
      setIsOpen(true);
    }
  };

  const handleSubmit = () => {
    if (!savedSelectionRef.current || !proposedText.trim()) return;

    const { from, to } = savedSelectionRef.current;
    const originalText = editor.state.doc.textBetween(from, to, "\n");

    editor.chain().focus().setTextSelection({ from, to }).run();

    editor.commands.setProposedEdit({
      range: { from, to },
      originalText,
      proposedText: proposedText.trim(),
    });

    setProposedText("");
    setIsOpen(false);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && event.shiftKey) {
      event.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className={cn("relative", className)} ref={containerRef}>
      <motion.button
        onMouseDown={(event) => {
          event.preventDefault();
        }}
        onClick={handleOpen}
        className={cn(
          "flex items-center gap-2 rounded px-2 py-1 text-sm transition-colors hover:bg-accent-foreground/40 hover:text-primary-foreground",
          isOpen && "bg-[#a55252] text-white",
        )}
      >
        <FileEdit size={14} /> Propose Edit
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
            <div className="flex w-72 items-end gap-1">
              <Textarea
                className="max-h-[300px] min-h-[36px] flex-1 resize-none overflow-y-auto border-none bg-accent text-sm focus-visible:ring-1 focus-visible:ring-ring"
                autoFocus
                placeholder={
                  canPropose
                    ? "Write proposed edit..."
                    : "Select text to propose an edit"
                }
                onInput={(event) => {
                  event.currentTarget.style.height = "auto";
                  event.currentTarget.style.height = `${event.currentTarget.scrollHeight}px`;
                }}
                value={proposedText}
                onChange={(event) => setProposedText(event.target.value)}
                onKeyDown={handleKeyDown}
                disabled={!canPropose}
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSubmit}
                disabled={!canPropose || proposedText.trim() === ""}
                className="mb-1 shrink-0 rounded-full bg-primary p-2 text-primary-foreground disabled:opacity-50"
              >
                <ArrowUpIcon size={12} />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProposedEditPopover;
