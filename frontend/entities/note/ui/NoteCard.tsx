import React, { useState } from "react";
import { motion } from "framer-motion";

import { PreviewOverlay } from "@/shared/components/PreviewOverlay";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/shared/components/ui/context-menu";
import { Trash2Icon, Eye, Edit3, Brain, FolderInput } from "lucide-react";

import NoteDisplay from "./NoteDisplay";
import FolderTreeSelector from "./FolderTreeSelector";
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
  onFocusEdit?: (id: string) => void;
};

export default function NoteCard({
  match,
  onDelete,
  onUpdateNote,
  onPin,
  onFocusEdit,
}: Props) {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const handleDelete = async () => {
    if (onDelete) {
      await onDelete(match.id);
    }
  };

  const handlePreview = () => {
    setIsPreviewOpen(true);
  };

  const handleFocusEdit = () => {
    onFocusEdit?.(match.id);
  };

  const handlePin = (tom: boolean) => {
    if (onPin) {
      onPin(match.id, tom);
    }
  };

  const handleFolderSelect = (folderId: string | null) => {
    if (onUpdateNote) {
      onUpdateNote(match.id, { id: match.id, folder_id: folderId });
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
            className="rounded-2xl bg-surface-50 w-full p-6 overflow-hidden"
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
      <ContextMenuContent className="bg-surface border-border shadow-lg">
        <ContextMenuItem
          onSelect={handlePreview}
          className="hover:bg-surface-elevated"
        >
          <Eye className="w-4 h-4 " />
          <p className="text-sm">Preview</p>
        </ContextMenuItem>
        <ContextMenuItem
          onSelect={handleFocusEdit}
          className="focus:bg-surface-elevated"
        >
          <Edit3 className="w-4 h-4 " />
          <p className="text-sm">Focus Edit</p>
        </ContextMenuItem>
        <ContextMenuSub>
          <ContextMenuSubTrigger className="cursor-pointer focus:bg-surface-elevated/40 text-text-primary">
            <FolderInput className="w-4 h-4 mr-2" />
            <span className="text-sm">Add to Folder</span>
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="min-h-32 w-80 p-2 bg-surface border-border shadow-lg">
            <FolderTreeSelector
              onSelect={handleFolderSelect}
              currentFolderId={match.folder_id ?? undefined}
            />
          </ContextMenuSubContent>
        </ContextMenuSub>
        <ContextMenuItem
          onClick={handleDelete}
          className="focus:bg-surface-elevated "
        >
          <Trash2Icon className="w-3 h-3" />
          <p className="text-sm ">Delete</p>
        </ContextMenuItem>
        <ContextMenuItem
          onClick={() => handlePin(true)}
          className="focus:bg-glass-hover"
        >
          <Brain className="w-3 h-3" />
          <p className="text-sm">Pin</p>
        </ContextMenuItem>
      </ContextMenuContent>

      {/* Preview Overlay */}
      <PreviewOverlay
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        item={match}
      />
    </ContextMenu>
  );
}
