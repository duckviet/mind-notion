import React from "react";
import { Card } from "@/shared/components/Card";
import { ResDetailNote } from "@/shared/services/generated/api";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/shared/components/ui/context-menu";

type TopOfMindCardProps = {
  note: ResDetailNote;
  onUnpin: () => void;
};

const TopOfMindCard: React.FC<TopOfMindCardProps> = ({ note, onUnpin }) => {
  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <Card className="w-42 h-32  flex flex-col justify-center items-center rounded-xl bg-white ">
          <h3 className="text-base font-semibold text-center truncate w-full px-2">
            {note.title}
          </h3>

          <p className="text-xs text-text-muted  line-clamp-3 w-full">
            {note.content}
          </p>
        </Card>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onClick={onUnpin}>Unpin</ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
};

export default TopOfMindCard;
