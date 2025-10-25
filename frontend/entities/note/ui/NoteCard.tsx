import React, { useState } from "react";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";

import { PreviewOverlay } from "@/shared/components/PreviewOverlay";

// Dynamic import to prevent SSR issues
const FocusEditModal = dynamic(
  () =>
    import("@/features/note-editing").then((mod) => ({
      default: mod.FocusEditModal,
    })),
  { ssr: false }
);
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from "@/shared/components/ui/context-menu";
import { Trash2Icon, Eye, Edit3 } from "lucide-react";

import NoteDisplay from "./NoteDisplay";
import { Card } from "@/shared/components/Card";
import { ReqUpdateNote, ResDetailNote } from "@/shared/services/generated/api";

export interface NoteCardProps extends ResDetailNote {
  score: number;
}

type Props = {
  match: NoteCardProps;
  onDelete?: (id: string) => Promise<void>;
  onUpdateNote?: (id: string, data: ReqUpdateNote) => void;
};

export default function NoteCard({ match, onDelete, onUpdateNote }: Props) {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isFocusEditOpen, setIsFocusEditOpen] = useState(false);

  const handleSaveNote = (data: ReqUpdateNote) => {
    if (onUpdateNote) {
      onUpdateNote(match.id, data);
    }
  };

  const handleDelete = async () => {
    if (onDelete) {
      await onDelete(match.id);
    }
  };

  const handlePreview = () => {
    setIsPreviewOpen(true);
  };

  const handleFocusEdit = () => {
    setIsFocusEditOpen(true);
  };

  // Add keyboard shortcut for focus edit (E key)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "e" && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      handleFocusEdit();
    }
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          onDoubleClick={handleFocusEdit}
          onKeyDown={handleKeyDown}
          className="cursor-pointer"
          tabIndex={0}
          role="button"
          aria-label={`Edit note: ${match.title}. Double-click or press E to edit.`}
        >
          <Card
            // role="article"
            className="rounded-lg border-none"
            aria-label={`Note card: ${match.title}`}
          >
            <div className="flex justify-between items-center w-full mb-3  gap-4">
              <h2 className="text-lg font-semibold text-text-primary leading-tight">
                {match.title}
              </h2>
            </div>
            <div className="h-px w-full bg-gradient-to-r from-transparent via-glass-border to-transparent mb-4"></div>
            <NoteDisplay content={match.content} />
          </Card>
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent className="glass-bg border-glass-border shadow-glass-lg">
        <ContextMenuItem
          onSelect={handlePreview}
          className="focus:bg-glass-hover"
        >
          <p className="text-sm">Preview</p>
          <ContextMenuShortcut>
            <Eye className="w-4 h-4 " />
          </ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem
          onSelect={handleFocusEdit}
          className="focus:bg-glass-hover"
        >
          <p className="text-sm">Focus Edit</p>
          <ContextMenuShortcut>
            <Edit3 className="w-4 h-4 " />
          </ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem
          onClick={handleDelete}
          className="focus:bg-glass-hover text-red-500 hover:text-red-600"
        >
          <p className="text-sm">Delete</p>
          <ContextMenuShortcut>
            <Trash2Icon className="w-3 h-3" />
          </ContextMenuShortcut>
        </ContextMenuItem>
      </ContextMenuContent>

      {/* Preview Overlay */}
      <PreviewOverlay
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        item={match}
      />

      {/* Focus Edit Modal */}
      <FocusEditModal
        isOpen={isFocusEditOpen}
        onClose={() => setIsFocusEditOpen(false)}
        note={match}
        onSave={handleSaveNote}
      />
    </ContextMenu>
  );
}
