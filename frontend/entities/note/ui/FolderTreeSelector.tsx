import React, { useState } from "react";
import { useFolders } from "@/shared/hooks/useFolders";
import { ResDetailFolder } from "@/shared/services/generated/api";
import { Folder, FolderOpen, ChevronRight, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface FolderTreeNodeProps {
  folder: ResDetailFolder;
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
  const hasChildren =
    folder.children_folders && folder.children_folders.length > 0;
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
          "flex items-center gap-2 py-1.5 rounded-md cursor-pointer hover:bg-gray-100 transition-colors",
          isSelected && "bg-blue-50 hover:bg-blue-100"
        )}
        style={{ paddingLeft: `${level * 4 + 4}px` }}
        onClick={handleSelect}
      >
        {hasChildren ? (
          <button
            onClick={handleToggle}
            className="p-0.5 hover:bg-gray-200 rounded"
          >
            {isExpanded ? (
              <ChevronDown className="w-3.5 h-3.5 text-gray-600" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-gray-600" />
            )}
          </button>
        ) : (
          <span className="w-4" />
        )}
        {isExpanded ? (
          <FolderOpen className="w-4 h-4 text-blue-600" />
        ) : (
          <Folder className="w-4 h-4 text-gray-600" />
        )}
        <span
          className={cn(
            "text-sm flex-1",
            isSelected ? "font-medium text-blue-700" : "text-gray-700"
          )}
        >
          {folder.name}
        </span>
      </div>
      {/* {isExpanded && hasChildren && (
        <div>
          {folder.children_folders?.map((child) => (
            <FolderTreeNode
              key={child.id}
              folder={child}
              level={level + 1}
              onSelect={onSelect}
              selectedFolderId={selectedFolderId}
            />
          ))}
        </div>
      )} */}
    </div>
  );
}

interface FolderTreeSelectorProps {
  onSelect: (folderId: string | null) => void;
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

  const handleSelect = (folderId: string) => {
    setSelectedFolderId(folderId);
    onSelect(folderId);
  };

  const handleRemoveFromFolder = () => {
    setSelectedFolderId(undefined);
    onSelect(null);
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
    <div className="max-h-[400px] overflow-y-auto">
      {/* Option to remove from folder */}
      {currentFolderId && (
        <div
          className={cn(
            "flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer hover:bg-gray-100 transition-colors mb-2 border-b",
            !selectedFolderId && "bg-blue-50 hover:bg-blue-100"
          )}
          onClick={handleRemoveFromFolder}
        >
          <Folder className="w-4 h-4 text-gray-400" />
          <span
            className={cn(
              "text-sm",
              !selectedFolderId ? "font-medium text-blue-700" : "text-gray-600"
            )}
          >
            Remove from folder
          </span>
        </div>
      )}

      {/* Folder tree */}
      {folders.map((folder) => (
        <FolderTreeNode
          key={folder.id}
          folder={folder}
          level={0}
          onSelect={handleSelect}
          selectedFolderId={selectedFolderId}
        />
      ))}
    </div>
  );
}
