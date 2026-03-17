"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  ChevronDown,
  ChevronRight,
  FileText,
  Folder,
  FolderOpen,
  FolderTree,
  GripVertical,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SortableItem } from "@/shared/components/dnd";
import { useFolders } from "@/shared/hooks/useFolders";
import { useNotes } from "@/shared/hooks/useNotes";
import { reorderFolders as apiReorderFolders } from "@/shared/services/generated/api";

type FolderNode = {
  id: string;
  name: string;
  parentId: string;
  order: number;
  children: FolderNode[];
};

type FileFolderTreeProps = {
  pathname: string;
};

const ROOT_PARENT_KEY = "__root__";

function isFolderRoute(pathname: string, folderId: string): boolean {
  return pathname === `/folder/${folderId}`;
}

function isNoteRoute(pathname: string, noteId: string): boolean {
  return (
    pathname === `/note/${noteId}` || pathname.startsWith(`/note/${noteId}/`)
  );
}

export function FileFolderTree({ pathname }: FileFolderTreeProps) {
  const [isSectionOpen, setIsSectionOpen] = useState(true);
  const [isReordering, setIsReordering] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set(),
  );

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  );

  const {
    folders,
    isLoading: isLoadingFolders,
    refetch,
  } = useFolders({
    limit: 200,
    offset: 0,
  });
  const { notes, isLoading: isLoadingNotes } = useNotes({
    limit: 200,
    offset: 0,
    query: "",
    folder_id: "",
  });

  const {
    rootFolders,
    notesByFolder,
    rootNotes,
    parentByFolderId,
    siblingsByParent,
  } = useMemo(() => {
    const sortedFolders = [...folders].sort((a, b) => {
      if (a.order !== b.order) {
        return a.order - b.order;
      }
      return a.created_at.localeCompare(b.created_at);
    });

    const map: Record<string, FolderNode> = {};
    const parentMap: Record<string, string> = {};
    const siblingsMap = new Map<string, string[]>();

    for (const folder of sortedFolders) {
      const parentKey = folder.parent_id || ROOT_PARENT_KEY;
      parentMap[folder.id] = parentKey;
      const siblingIds = siblingsMap.get(parentKey) || [];
      siblingIds.push(folder.id);
      siblingsMap.set(parentKey, siblingIds);

      map[folder.id] = {
        id: folder.id,
        name: folder.name,
        parentId: folder.parent_id,
        order: folder.order,
        children: [],
      };
    }

    const roots: FolderNode[] = [];
    for (const folder of sortedFolders) {
      const node = map[folder.id];
      if (folder.parent_id && map[folder.parent_id]) {
        map[folder.parent_id].children.push(node);
      } else {
        roots.push(node);
      }
    }

    const grouped = new Map<string, { id: string; name: string }[]>();
    const loose: { id: string; name: string }[] = [];

    for (const note of notes) {
      const id = note.id;
      const name = note.title || "Untitled note";
      const folderId = note.folder_id || "";
      if (!folderId) {
        loose.push({ id, name });
        continue;
      }
      const existing = grouped.get(folderId) || [];
      existing.push({ id, name });
      grouped.set(folderId, existing);
    }

    return {
      rootFolders: roots,
      notesByFolder: grouped,
      rootNotes: loose,
      parentByFolderId: parentMap,
      siblingsByParent: siblingsMap,
    };
  }, [folders, notes]);

  const isLoading = isLoadingFolders || isLoadingNotes;

  useEffect(() => {
    if (!folders.length) {
      return;
    }

    setExpandedFolders((prev) => {
      if (prev.size > 0) {
        return prev;
      }

      const next = new Set<string>();
      for (const folder of folders) {
        if (!folder.parent_id) {
          next.add(folder.id);
        }
      }
      return next;
    });
  }, [folders]);

  const toggleFolder = (folderId: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || isReordering) {
      return;
    }

    const activeId = active.id.toString();
    const overId = over.id.toString();
    if (activeId === overId) {
      return;
    }

    const activeParent = parentByFolderId[activeId];
    const overParent = parentByFolderId[overId];
    if (!activeParent || !overParent || activeParent !== overParent) {
      return;
    }

    const currentSiblingIDs = siblingsByParent.get(activeParent) || [];
    const oldIndex = currentSiblingIDs.indexOf(activeId);
    const newIndex = currentSiblingIDs.indexOf(overId);
    if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) {
      return;
    }

    const reorderedIDs = arrayMove(currentSiblingIDs, oldIndex, newIndex);

    setIsReordering(true);
    try {
      await apiReorderFolders({
        parent_id: activeParent === ROOT_PARENT_KEY ? "" : activeParent,
        folder_ids: reorderedIDs,
      });
      await refetch();
    } catch (error) {
      console.error("Failed to reorder folders:", error);
    } finally {
      setIsReordering(false);
    }
  };

  const renderNote = (note: { id: string; name: string }, depth: number) => {
    const isActive = isNoteRoute(pathname, note.id);
    return (
      <div
        key={note.id}
        className="pr-2"
        style={{ paddingLeft: `${depth * 16 + 36}px` }}
      >
        <Link
          href={`/note/${note.id}/edit`}
          className={cn(
            "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
            isActive
              ? "bg-surface-100 text-text-primary font-medium"
              : "text-text-muted hover:bg-surface-100/60 hover:text-text-primary",
          )}
        >
          <FileText className="size-4 shrink-0" />
          <span className="truncate">{note.name}</span>
        </Link>
      </div>
    );
  };

  const renderFolder = (folder: FolderNode, depth: number) => {
    const folderNotes = notesByFolder.get(folder.id) || [];
    const hasChildren = folder.children.length > 0 || folderNotes.length > 0;
    const isExpanded = expandedFolders.has(folder.id);
    const isActive = isFolderRoute(pathname, folder.id);

    return (
      <SortableItem
        key={folder.id}
        id={folder.id}
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
                  onClick={() => toggleFolder(folder.id)}
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
                    ? "bg-surface-100 text-text-primary font-medium"
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
                className="inline-flex size-6 items-center justify-center rounded-md text-text-muted hover:bg-surface-100/70 cursor-grab active:cursor-grabbing touch-none"
                aria-label="Drag folder to reorder"
              >
                <GripVertical className="size-4" />
              </button>
            </div>

            {isExpanded ? (
              <div className="w-full">
                {folder.children.length > 0 ? (
                  <SortableContext
                    items={folder.children.map((child) => child.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {folder.children.map((child) =>
                      renderFolder(child, depth + 1),
                    )}
                  </SortableContext>
                ) : null}
                {folderNotes.map((note) => renderNote(note, depth + 1))}
              </div>
            ) : null}
          </div>
        )}
      </SortableItem>
    );
  };

  return (
    <SidebarTreeSection
      isOpen={isSectionOpen}
      onToggle={() => setIsSectionOpen((prev) => !prev)}
    >
      {isLoading ? (
        <p className="px-2 py-2 text-xs text-text-muted">Loading files...</p>
      ) : rootFolders.length === 0 && rootNotes.length === 0 ? (
        <p className="px-2 py-2 text-xs text-text-muted">No folders or files</p>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={(event) => {
            void handleDragEnd(event);
          }}
        >
          <div className="space-y-0.5">
            {rootFolders.length > 0 ? (
              <SortableContext
                items={rootFolders.map((folder) => folder.id)}
                strategy={verticalListSortingStrategy}
              >
                {rootFolders.map((folder) => renderFolder(folder, 0))}
              </SortableContext>
            ) : null}
            {rootNotes.map((note) => renderNote(note, 0))}
          </div>
        </DndContext>
      )}
    </SidebarTreeSection>
  );
}

type SidebarTreeSectionProps = {
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
};

function SidebarTreeSection({
  isOpen,
  onToggle,
  children,
}: SidebarTreeSectionProps) {
  return (
    <div className="group-data-[collapsible=icon]:hidden">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between rounded-md px-2 py-2 text-xs font-semibold uppercase tracking-wide text-text-muted hover:bg-surface-100/50"
      >
        <div className="flex gap-3 items-center">
          <FolderTree className="size-4 text-text-muted ml-1" />
          <span>File / Folder</span>
        </div>
        {isOpen ? (
          <ChevronDown className="size-4" />
        ) : (
          <ChevronRight className="size-4" />
        )}
      </button>
      {isOpen ? <div className="mt-1">{children}</div> : null}
    </div>
  );
}
