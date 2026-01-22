import React from "react";
import { Card } from "@/shared/components/Card";
import { ResDetailNote } from "@/shared/services/generated/api";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/shared/components/ui/context-menu";
import NoteDisplay from "@/entities/note/ui/NoteDisplay";
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
          <Card className="w-42 h-32 overflow-hidden rounded-xl bg-surface-50   py-2 px-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-full">
              <CardTitle className="line-clamp-2 mb-1 text-text-primary">
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
