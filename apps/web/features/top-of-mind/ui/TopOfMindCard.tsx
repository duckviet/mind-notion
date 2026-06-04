import React from "react";
import { Card } from "@/shared/components/Card";
import { ResDetailNote } from "@/shared/services/generated/api";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/shared/components/ui/context-menu";
import { NoteDisplay } from "@/entities/note";
import { CardContent, CardTitle } from "@/shared/components/ui/card";

type TopOfMindCardProps = {
  note: ResDetailNote;
  onUnpin: () => void;
  onFocusEdit?: () => void;
};

const TopOfMindCard: React.FC<TopOfMindCardProps> = ({
  note,
  onUnpin,
  onFocusEdit,
}) => {
  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <div
          onDoubleClick={onFocusEdit}
          className="cursor-pointer"
          style={{ userSelect: "none", msUserSelect: "none" }}
        >
          <Card className="h-32 w-42 overflow-hidden rounded-xl bg-card px-4 py-2  dark:border-border dark:bg-surface-100 dark:shadow-md transition-all hover:border-border-strong dark:hover:border-border-strong dark:hover:bg-surface-200">
            <div className="w-full">
              <CardTitle className="mb-1 line-clamp-2 font-serif text-sm font-normal text-text-primary">
                {note.title}
              </CardTitle>
            </div>
            <CardContent className="p-0">
              <NoteDisplay content={note.content} zoom={0.5} />
            </CardContent>
          </Card>
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onClick={onUnpin}>Unpin</ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
};

export default TopOfMindCard;
