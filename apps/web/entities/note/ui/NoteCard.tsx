import React, { useState } from "react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/shared/components/ui/context-menu";
import {
  Trash2Icon,
  Eye,
  Edit3,
  Brain,
  FolderInput,
  Expand,
} from "lucide-react";

import NoteDisplay from "./NoteDisplay";
import { FolderTreeSelector } from "@/shared/components/FolderTreeSelector";
import { Card } from "@/shared/components/Card";
import { ReqUpdateNote, ResDetailNote } from "@/shared/services/generated/api";
import { Button } from "@/shared/components/ui/button";
import { useRouter } from "next/navigation";
import { CardTitle } from "@/shared/components/ui/card";

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
  const router = useRouter();

  const handleDelete = async () => {
    if (onDelete) {
      await onDelete(match.id);
    }
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
            className="group relative w-full overflow-hidden rounded-xl p-6 hover:border-border-strong dark:border-border dark:bg-surface-100 dark:shadow-md dark:hover:bg-surface-200 dark:hover:border-border-strong"
            aria-label={`Note card: ${match.title}`}
          >
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => router.push(`/note/${match.id}/edit`)}
              aria-label="Expand"
              className="absolute top-2 right-2 opacity-0 transition-opacity hover:bg-accent group-hover:opacity-100"
            >
              <Expand className="w-4 h-4" />
            </Button>
            <div className="flex justify-between items-center w-full mb-4">
              <CardTitle className="font-serif text-heading-lg! font-normal leading-tight text-text-primary">
                {match.title}
              </CardTitle>
            </div>
            <div className="overflow-hidden">
              <NoteDisplay content={match.content} />
            </div>
          </Card>
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent className="border-border shadow-md">
        <ContextMenuItem
          onSelect={handleFocusEdit}
          className="focus:bg-accent"
        >
          <Edit3 className="w-4 h-4 " />
          <p className="text-sm">Focus Edit</p>
        </ContextMenuItem>
        <ContextMenuSub>
          <ContextMenuSubTrigger className="cursor-pointer text-text-primary focus:bg-accent">
            <FolderInput className="w-4 h-4 mr-2" />
            <span className="text-sm">Add to Folder</span>
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="min-h-32 w-80 border-border p-2 shadow-md">
            <FolderTreeSelector
              onSelect={handleFolderSelect}
              currentFolderId={match.folder_id ?? undefined}
            />
          </ContextMenuSubContent>
        </ContextMenuSub>
        <ContextMenuItem onClick={handleDelete} className="focus:bg-accent">
          <Trash2Icon className="w-3 h-3" />
          <p className="text-sm ">Delete</p>
        </ContextMenuItem>
        <ContextMenuItem
          onClick={() => handlePin(true)}
          className="focus:bg-accent"
        >
          <Brain className="w-3 h-3" />
          <p className="text-sm">Pin</p>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
