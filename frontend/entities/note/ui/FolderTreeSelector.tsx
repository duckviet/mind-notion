import React, { useMemo, useState } from "react";
import { useFolders } from "@/shared/hooks/useFolders";
import { ResDetailFolder } from "@/shared/services/generated/api";
import { Folder, FolderOpen, ChevronRight, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import FolderTreeNode, { FolderWithChildren } from "./FolderTreeNode";

interface FolderTreeSelectorProps {
  onSelect?: (folderId: string | null) => void;
  currentFolderId?: string;
}

export default function FolderTreeSelector({
  onSelect,
  currentFolderId,
}: FolderTreeSelectorProps) {
  const { folders, isLoading } = useFolders({ limit: 100, offset: 0 });
  const [selectedFolderId, setSelectedFolderId] = useState<string | undefined>(
    currentFolderId,
  );

  // 3. Sử dụng useMemo để tính toán cây thư mục một lần khi folders thay đổi
  const rootFolders = useMemo(() => {
    if (!folders) return [];

    const folderMap: Record<string, FolderWithChildren> = {};

    // Bước 1: Tạo map và khởi tạo mảng children rỗng cho tất cả folder
    folders.forEach((folder) => {
      folderMap[folder.id] = { ...folder, children: [] };
    });

    const roots: FolderWithChildren[] = [];

    // Bước 2: Duyệt qua map để lắp ráp cây
    folders.forEach((folder) => {
      const currentFolder = folderMap[folder.id];
      // API của bạn trả về parent_id rỗng ("") nếu là root
      if (folder.parent_id && folderMap[folder.parent_id]) {
        folderMap[folder.parent_id].children?.push(currentFolder);
      } else {
        roots.push(currentFolder);
      }
    });

    return roots;
  }, [folders]);

  const handleSelect = (folderId: string) => {
    console.log("Folder selected in tree selector:", folderId);
    setSelectedFolderId(folderId);
    onSelect && onSelect(folderId);
  };

  if (isLoading) {
    return (
      <div className="p-4 text-center text-sm text-gray-500">
        Loading folders...
      </div>
    );
  }

  if (!folders || folders.length === 0) {
    return (
      <div className="p-4 text-center text-sm text-gray-500">
        No folders available. Create a folder first.
      </div>
    );
  }

  return (
    <div className="max-h-[400px] overflow-y-auto   rounded-md bg-surface-50 ">
      {/* Option to remove from folder */}
      <div
        className={cn(
          "flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-surface-100/70 transition-colors border-b border-gray-200 sticky top-0  z-10",
          !selectedFolderId && "bg-surface/70",
        )}
        onClick={() => onSelect && onSelect(null)}
      >
        <div className="w-5" /> {/* Spacer cho thẳng hàng icon */}
        <Folder className="w-4 h-4 text-gray-400" />
        <span className={cn("text-sm")}>Root (No parent)</span>
      </div>

      {/* Folder tree rendering */}
      <div className="py-1">
        {rootFolders.map((folder) => (
          <FolderTreeNode
            currentFolderId={currentFolderId}
            key={folder.id}
            folder={folder}
            level={0}
            onSelect={handleSelect}
            selectedFolderId={selectedFolderId}
          />
        ))}
      </div>
    </div>
  );
}
