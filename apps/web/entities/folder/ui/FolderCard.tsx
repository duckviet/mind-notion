import {
  FolderOpen,
  FileText,
  HardDrive,
  Clock,
  Trash2,
  FolderInput,
} from "lucide-react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/shared/components/ui/context-menu";
import Link from "next/link";
import { FolderTreeSelector } from "@/shared/components/FolderTreeSelector";
import { Card } from "@/shared/components/Card";
import { DroppableZone } from "@/shared/components/dnd";

interface FolderCardProps {
  id: string;
  name: string;
  notesCount: number;
  subFoldersCount: number;
  updatedAt: string;
  isPublic: boolean;
  onDelete?: (id: string) => void;
  onMoveToFolder?: (folderId: string | null) => void;
}

const FolderCard = ({
  id,
  name,
  notesCount,
  subFoldersCount,
  updatedAt,
  isPublic,
  onDelete,
  onMoveToFolder,
}: FolderCardProps) => {
  return (
    <DroppableZone
      id={`folder-${id}`}
      className="group"
      activeClassName="ring-2 ring-brand-600/20 ring-offset-1 ring-offset-background rounded-lg"
    >
      <ContextMenu>
        <ContextMenuTrigger asChild className="outline-none">
          <Link href={`/folder/${id}`}>
            <Card className="border-0 bg-transparent">
              <div className="h-[130px] w-full   relative pt-6 ">
                {/* Folder tab background */}
                <div className="absolute top-0 left-0 w-full h-full z-0">
                  {/* Lớp folder phía sau cùng (Cái tai cao nhất) */}
                  <div className="absolute -top-0 left-0 h-10 w-1/2 rounded-t-[9.6px] rounded-tr-3xl bg-surface-100"></div>
                  {/* Lớp thân folder phía sau (Phần hình chữ nhật bao quanh) */}
                  <div className="absolute left-0 top-2 h-[calc(100%-16px)] w-full rounded-lg bg-surface-100"></div>

                  {notesCount != 0 && (
                    <div className="absolute left-4 right-4 top-4 h-[40%] rounded-lg border border-border border-solid bg-surface-50"></div>
                  )}
                </div>

                {/* Main folder content - Thêm shadow để tách biệt với nền */}
                <div className="relative flex h-full w-full flex-col justify-between rounded-lg border border-border border-solid bg-card p-6 shadow-none transition-colors group-hover:border-border-strong">
                  {/* Folder title */}
                  <div className="flex items-start gap-2 mb-2">
                    <FolderOpen className="w-5 h-5 text-text-primary" />
                    <span className="font-medium text-text-primary">
                      {name}
                    </span>
                  </div>

                  {/* Folder info */}
                  <div className="space-y-3 w-full">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-text-secondary">
                        <FileText className="w-4 h-4" />
                        <span className="text-[14px]">Files</span>
                      </div>
                      <div className="flex-1 border-b border-border-subtle mx-3 mb-1"></div>
                      <span className="text-sm font-medium text-text-primary">
                        {notesCount}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </Link>
        </ContextMenuTrigger>
        <ContextMenuContent className="border-border shadow-md">
          <ContextMenuItem
            onSelect={() => onDelete?.(id)}
            className="text-destructive hover:bg-accent"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            <span>Delete</span>
          </ContextMenuItem>

          <ContextMenuSub>
            <ContextMenuSubTrigger className="cursor-pointer">
              <FolderInput className="w-4 h-4 mr-2" />
              <span className="text-sm">Add to Folder</span>
            </ContextMenuSubTrigger>
            <ContextMenuSubContent className="min-h-32 w-80 border-border p-2 shadow-md">
              <FolderTreeSelector
                onSelect={onMoveToFolder}
                currentFolderId={id}
              />
            </ContextMenuSubContent>
          </ContextMenuSub>
        </ContextMenuContent>
      </ContextMenu>
    </DroppableZone>
  );
};

export default FolderCard;
