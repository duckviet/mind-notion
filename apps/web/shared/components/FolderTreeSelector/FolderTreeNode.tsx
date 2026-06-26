import React, { useMemo, useState } from "react";
import { useFolders } from "@/shared/hooks/useFolders";
import { ResDetailFolder } from "@/shared/services/generated/api";
import { Folder, FolderOpen, ChevronRight, ChevronDown } from "lucide-react";
import { cn } from "@/shared/utils/cn";

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
      <div
        className={cn(
          "flex w-full cursor-pointer items-center gap-2 rounded-[8px] py-1.5 pr-2 transition-colors hover:bg-surface-100/70",
          isSelected && "bg-surface-100",
          folder.id === currentFolderId && "cursor-not-allowed text-text-muted",
        )}
        style={{ paddingLeft: `${level * 16 + 8}px` }} // Tăng padding để dễ nhìn cấp độ
        onClick={handleSelect}
      >
        {hasChildren ? (
          <button
            onClick={handleToggle}
            className="shrink-0 rounded p-0.5 hover:bg-accent"
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-text-muted" />
            ) : (
              <ChevronRight className="h-4 w-4 text-text-muted" />
            )}
          </button>
        ) : (
          <span className="w-5 shrink-0" /> // Placeholder để căn lề
        )}

        {isExpanded ? (
          <FolderOpen className="h-4 w-4 shrink-0 text-brand-600" />
        ) : (
          <Folder className="h-4 w-4 shrink-0 text-text-muted" />
        )}

        <span
          className={cn(
            "select-none truncate text-sm",
            isSelected ? "font-medium text-text-primary" : "text-text-secondary",
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
