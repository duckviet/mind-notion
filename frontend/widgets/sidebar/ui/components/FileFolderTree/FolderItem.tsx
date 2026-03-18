import Link from "next/link";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  ChevronDown,
  ChevronRight,
  Folder,
  FolderOpen,
  GripVertical,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SortableItem } from "@/shared/components/dnd";
import { FolderNode } from "./types";
import { getFolderSortableId, isFolderRoute } from "./utils";
import { NoteItem } from "./NoteItem";

type FolderItemProps = {
  folder: FolderNode;
  depth: number;
  pathname: string;
  isExpanded: boolean;
  isReordering: boolean;
  onToggle: (id: string) => void;
  expandedFolders: Set<string>;
};

export function FolderItem({
  folder,
  depth,
  pathname,
  isExpanded,
  isReordering,
  onToggle,
  expandedFolders,
}: FolderItemProps) {
  const hasChildren =
    folder.children.length > 0 || (folder.notes && folder.notes.length > 0);
  const isActive = isFolderRoute(pathname, folder.id);

  return (
    <SortableItem
      id={getFolderSortableId(folder.id)}
      disabled={isReordering}
      useDragHandle
    >
      {({ dragHandleProps }) => (
        <div className="w-full">
          <div
            className="flex items-center gap-1 pr-2"
            style={{ paddingLeft: `${depth * 16 + 8}px` }}
          >
            {hasChildren ? (
              <button
                type="button"
                onClick={() => onToggle(folder.id)}
                className="inline-flex size-6 items-center justify-center rounded-md text-text-muted hover:bg-surface-100/70"
                aria-label={isExpanded ? "Collapse folder" : "Expand folder"}
              >
                {isExpanded ? (
                  <ChevronDown className="size-4" />
                ) : (
                  <ChevronRight className="size-4" />
                )}
              </button>
            ) : (
              <span className="inline-block size-6" />
            )}

            <Link
              href={`/folder/${folder.id}`}
              className={cn(
                "flex min-w-0 flex-1 items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
                isActive
                  ? "bg-surface-100 font-medium text-text-primary"
                  : "text-text-muted hover:bg-surface-100/60 hover:text-text-primary",
              )}
            >
              {isExpanded ? (
                <FolderOpen className="size-4 shrink-0" />
              ) : (
                <Folder className="size-4 shrink-0" />
              )}
              <span className="truncate">{folder.name}</span>
            </Link>

            <button
              type="button"
              {...dragHandleProps}
              onClick={(event) => event.preventDefault()}
              className="inline-flex size-6 touch-none items-center justify-center rounded-md text-text-muted hover:bg-surface-100/70 cursor-grab active:cursor-grabbing"
              aria-label="Drag folder to reorder"
            >
              <GripVertical className="size-4" />
            </button>
          </div>

          {isExpanded && (
            <div className="w-full">
              {folder.children.length > 0 && (
                <SortableContext
                  items={folder.children.map((child) =>
                    getFolderSortableId(child.id),
                  )}
                  strategy={verticalListSortingStrategy}
                >
                  {folder.children.map((child) => (
                    <FolderItem
                      key={child.id}
                      folder={child}
                      depth={depth + 1}
                      pathname={pathname}
                      isExpanded={expandedFolders.has(child.id)}
                      isReordering={isReordering}
                      onToggle={onToggle}
                      expandedFolders={expandedFolders}
                    />
                  ))}
                </SortableContext>
              )}

              {folder.notes && folder.notes.length > 0 && (
                <>
                  {folder.notes.map((note) => (
                    <NoteItem
                      key={note.id}
                      note={note}
                      depth={depth + 1}
                      pathname={pathname}
                    />
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      )}
    </SortableItem>
  );
}
