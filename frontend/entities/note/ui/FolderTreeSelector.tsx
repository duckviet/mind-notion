import React, { useMemo, useState } from "react";
import { useFolders } from "@/shared/hooks/useFolders";
import { ResDetailFolder } from "@/shared/services/generated/api";
import { Folder, FolderOpen, ChevronRight, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { AnimateCardProvider } from "./AnimateCardProvider";

// 1. Định nghĩa lại type cho chính xác
type FolderWithChildren = ResDetailFolder & {
  children?: FolderWithChildren[]; // Đổi tên thành 'children' cho chuẩn React pattern, hoặc giữ children_folders nhưng phải thống nhất
};

interface FolderTreeNodeProps {
  folder: FolderWithChildren;
  level: number;
  onSelect: (folderId: string) => void;
  selectedFolderId?: string;
}

function FolderTreeNode({
  folder,
  level,
  onSelect,
  selectedFolderId,
}: FolderTreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Kiểm tra children có tồn tại và có phần tử không
  const hasChildren = folder.children && folder.children.length > 0;
  const isSelected = selectedFolderId === folder.id;

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  const handleSelect = () => {
    onSelect(folder.id);
  };

  return (
    <div>
      <div
        className={cn(
          "flex items-center gap-2 py-1.5 rounded-md cursor-pointer hover:bg-gray-100 transition-colors pr-2",
          isSelected && "bg-blue-50 hover:bg-blue-100"
        )}
        style={{ paddingLeft: `${level * 16 + 8}px` }} // Tăng padding để dễ nhìn cấp độ
        onClick={handleSelect}
      >
        {hasChildren ? (
          <button
            onClick={handleToggle}
            className="p-0.5 hover:bg-gray-200 rounded shrink-0"
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-500" />
            )}
          </button>
        ) : (
          <span className="w-5 shrink-0" /> // Placeholder để căn lề
        )}

        {isExpanded ? (
          <FolderOpen className="w-4 h-4 text-blue-600 shrink-0" />
        ) : (
          <Folder className="w-4 h-4 text-gray-600 shrink-0" />
        )}

        <span
          className={cn(
            "text-sm truncate select-none",
            isSelected ? "font-medium text-blue-700" : "text-gray-700"
          )}
        >
          {folder.name}
        </span>
      </div>

      {/* 2. Bỏ comment và render đệ quy */}
      {isExpanded && hasChildren && (
        <div>
          {folder.children!.map((child) => (
            <FolderTreeNode
              key={child.id}
              folder={child}
              level={level + 1}
              onSelect={onSelect}
              selectedFolderId={selectedFolderId}
            />
          ))}
        </div>
      )}
    </div>
  );
}

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
    currentFolderId
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
    <div className="max-h-[400px] overflow-y-auto   rounded-md bg-white">
      {/* Option to remove from folder */}
      <div
        className={cn(
          "flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-gray-100 transition-colors border-b border-gray-200 sticky top-0 bg-white z-10",
          !selectedFolderId && "bg-blue-50 hover:bg-blue-100"
        )}
        onClick={() => onSelect && onSelect(null)}
      >
        <div className="w-5" /> {/* Spacer cho thẳng hàng icon */}
        <Folder className="w-4 h-4 text-gray-400" />
        <span
          className={cn(
            "text-sm",
            !selectedFolderId ? "font-medium text-blue-700" : "text-gray-600"
          )}
        >
          Root (No parent)
        </span>
      </div>

      {/* Folder tree rendering */}
      <div className="py-1">
        {rootFolders.map((folder) => (
          <FolderTreeNode
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
