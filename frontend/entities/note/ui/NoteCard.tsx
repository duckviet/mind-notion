import React, { useState } from "react";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";

import { PreviewOverlay } from "@/shared/components/PreviewOverlay";
import { useModal } from "@/shared/contexts/ModalContext";

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
import { Trash2Icon, Eye, Edit3, Brain } from "lucide-react";

import NoteDisplay from "./NoteDisplay";
import { Card } from "@/shared/components/Card";
import { ReqUpdateNote, ResDetailNote } from "@/shared/services/generated/api";

export interface NoteCardProps extends ResDetailNote {
  score: number;
}

type Props = {
  match: NoteCardProps;
  onDelete?: (id: string) => void | Promise<void>;
  onUpdateNote?: (id: string, data: ReqUpdateNote) => void;
  onPin?: (id: string, tom: boolean) => void;
};

export default function NoteCard({
  match,
  onDelete,
  onUpdateNote,
  onPin,
}: Props) {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isFocusEditOpen, setIsFocusEditOpen] = useState(false);
  const { openModal, closeModal } = useModal();

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
    openModal();
  };

  const handlePin = (tom: boolean) => {
    if (onPin) {
      onPin(match.id, tom);
    }
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
            className="rounded-2xl bg-white w-full"
            aria-label={`Note card: ${match.title}`}
          >
            <div className="flex justify-between items-center w-full mb-4">
              <h2 className="text-xl font-semibold text-text-primary leading-tight">
                {match.title}
              </h2>
            </div>
            <div className="overflow-hidden">
              <NoteDisplay content={match.content} />
            </div>
          </Card>
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent className="bg-white border-gray-200 shadow-xl">
        <ContextMenuItem onSelect={handlePreview} className="hover:bg-gray-200">
          <p className="text-sm">Preview</p>
          <ContextMenuShortcut>
            <Eye className="w-4 h-4 " />
          </ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem
          onSelect={handleFocusEdit}
          className="focus:bg-gray-200"
        >
          <p className="text-sm">Focus Edit</p>
          <ContextMenuShortcut>
            <Edit3 className="w-4 h-4 " />
          </ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem onClick={handleDelete} className="focus:bg-gray-200 ">
          <p className="text-sm ">Delete</p>
          <ContextMenuShortcut>
            <Trash2Icon className="w-3 h-3" />
          </ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem
          onClick={() => handlePin(true)}
          className="focus:bg-glass-hover"
        >
          <p className="text-sm">Pin</p>
          <ContextMenuShortcut>
            <Brain className="w-3 h-3" />
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
        onClose={() => {
          setIsFocusEditOpen(false);
          closeModal();
        }}
        noteId={match.id}
        onSave={handleSaveNote}
      />
    </ContextMenu>
  );
}
