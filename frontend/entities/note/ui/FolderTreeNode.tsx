import React, { useMemo, useState } from "react";
import { useFolders } from "@/shared/hooks/useFolders";
import { ResDetailFolder } from "@/shared/services/generated/api";
import { Folder, FolderOpen, ChevronRight, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

// 1. Định nghĩa lại type cho chính xác
export type FolderWithChildren = ResDetailFolder & {
  children?: FolderWithChildren[]; // Đổi tên thành 'children' cho chuẩn React pattern, hoặc giữ children_folders nhưng phải thống nhất
};

interface FolderTreeNodeProps {
  folder: FolderWithChildren;
  level: number;
  onSelect: (folderId: string) => void;
  selectedFolderId?: string;
  currentFolderId?: string | undefined;
}

function FolderTreeNode({
  folder,
  level,
  onSelect,
  selectedFolderId,
  currentFolderId,
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
      <button
        className={cn(
          "flex items-center gap-2 py-1.5 rounded-md cursor-pointer w-full hover:bg-gray-100 transition-colors pr-2",
          isSelected && "bg-blue-50 hover:bg-blue-100",
          folder.id === currentFolderId && "cursor-not-allowed text-gray-400"
        )}
        style={{ paddingLeft: `${level * 16 + 8}px` }} // Tăng padding để dễ nhìn cấp độ
        onClick={handleSelect}
        disabled={folder.id === currentFolderId}
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
      </button>

      {/* 2. Bỏ comment và render đệ quy */}
      {isExpanded && hasChildren && (
        <div>
          {folder.children!.map((child) => (
            <FolderTreeNode
              currentFolderId={currentFolderId}
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

export default FolderTreeNode;
