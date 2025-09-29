import { cn } from "@/lib/utils";
import React from "react";
import WebArticleDisplay from "./WebArticleDisplay";
import NoteDisplay from "./NoteDisplay";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from "@/shared/components/ui/context-menu";
import { Trash2Icon } from "lucide-react";
import { EditNoteDialog } from "../EditDialog/EditDialog";

type Props = {
  match: {
    id: string;
    score: any;
    metadata: {
      type: string;
      title: string;
      content?: string;
      [key: string]: any;
    };
  };
  onDelete?: (id: string) => Promise<void>;
  onUpdateNote?: (id: string, data: { title: string; content: string }) => void;
};

export default function Card({ match, onDelete, onUpdateNote }: Props) {
  const handleSaveNote = (data: { title: string; content: string }) => {
    if (onUpdateNote) {
      onUpdateNote(match.id, data);
    }
  };

  const handleDelete = async () => {
    if (onDelete) {
      await onDelete(match.id);
    }
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger className="relative bg-gray-50 p-6 rounded-lg hover:shadow-lg shadow-md flex flex-col h-fit w-full">
        <div className="flex justify-between items-center w-full mb-2 gap-4">
          <h2 className="text-lg font-medium">{match.metadata.title}</h2>
        </div>
        <div className="h-[1px] w-full bg-gray-300 mb-3"></div>

        {match.metadata.type === "web_article" && (
          <WebArticleDisplay metadata={match.metadata} />
        )}
        {match.metadata.type === "note" && (
          <NoteDisplay metadata={match.metadata} />
        )}
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem
          disabled={match.metadata.type === "web_article"}
          onSelect={(e) => {
            e.preventDefault();
          }}
        >
          <EditNoteDialog note={match.metadata} onSave={handleSaveNote} />
        </ContextMenuItem>
        <ContextMenuItem onClick={handleDelete}>
          <p className="text-red-400 text-sm">Delete</p>
          <ContextMenuShortcut>
            <Trash2Icon className="w-3 h-3 text-red-400" />
          </ContextMenuShortcut>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
