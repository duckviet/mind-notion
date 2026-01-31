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
import FolderTreeSelector from "@/entities/note/ui/FolderTreeSelector";
import { Card } from "../Card";
import { DroppableZone } from "../dnd";

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
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };
  return (
    <DroppableZone
      id={`folder-${id}`}
      className="group"
      activeClassName="ring-2 ring-green-300/20 ring-offset-1 ring-offset-green-300/20 rounded-lg"
    >
      <ContextMenu>
        <ContextMenuTrigger asChild className="outline-none">
          <Link href={`/folder/${id}`}>
            <Card className="bg-transparent">
              <div className="h-[130px] w-full   relative pt-6 ">
                {/* Folder tab background */}
                <div className="absolute top-0 left-0 w-full h-full z-0">
                  {/* Lớp folder phía sau cùng (Cái tai cao nhất) */}
                  <div className="absolute -top-0 left-0 w-1/2 h-10  bg-surface-100 rounded-t-2xl rounded-tr-[40px]"></div>
                  {/* Lớp thân folder phía sau (Phần hình chữ nhật bao quanh) */}
                  <div className="absolute top-2 left-0 w-full h-[calc(100%-16px)]  bg-surface-100 rounded-2xl"></div>

                  {notesCount != 0 && (
                    <div className="absolute top-4 left-4 right-4 h-[40%]  bg-surface-50 border border-border border-solid  rounded-lg"></div>
                  )}
                </div>

                {/* Main folder content - Thêm shadow để tách biệt với nền */}
                <div className="bg-card border border-border border-solid rounded-2xl w-full h-full relative p-6 flex flex-col justify-between shadow-sm">
                  {/* Folder title */}
                  <div className="flex items-center gap-2 mb-2">
                    <FolderOpen className="w-5 h-5 text-text-primary" />
                    <span className=" font-semibold text-text-primary">
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
        <ContextMenuContent className="  border-border shadow-lg">
          <ContextMenuItem
            onSelect={() => onDelete?.(id)}
            className="hover: -elevated text-destructive"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            <span>Delete</span>
          </ContextMenuItem>

          <ContextMenuSub>
            <ContextMenuSubTrigger className="cursor-pointer">
              <FolderInput className="w-4 h-4 mr-2" />
              <span className="text-sm">Add to Folder</span>
            </ContextMenuSubTrigger>
            <ContextMenuSubContent className="min-h-32 w-80 p-2   border-border shadow-lg">
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
