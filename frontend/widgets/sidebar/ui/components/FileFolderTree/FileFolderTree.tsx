"use client";

import { useCallback, useMemo, useState } from "react";
import { DragEndEvent } from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useGlobalDndHandlers } from "@/shared/components/dnd";
import { useFolders } from "@/shared/hooks/useFolders";
import { useNotes } from "@/shared/hooks/useNotes";
import { reorderFolders as apiReorderFolders } from "@/shared/services/generated/api";

import { SidebarTreeSection } from "./SidebarTreeSection";
import { FolderItem } from "./FolderItem";
import { NoteItem } from "./NoteItem";
import { useTreeData } from "./hooks/useTreeData";
import {
  getFolderSortableId,
  parseFolderSortableId,
  ROOT_PARENT_KEY,
} from "./utils";

type FileFolderTreeProps = {
  pathname: string;
};

function FileFolderTree({ pathname }: FileFolderTreeProps) {
  const [isSectionOpen, setIsSectionOpen] = useState(true);
  const [isReordering, setIsReordering] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set(),
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

  const { rootFolders, rootNotes, parentByFolderId, siblingsByParent } =
    useTreeData(folders, notes);

  const isLoading = isLoadingFolders || isLoadingNotes;

  const toggleFolder = useCallback((folderId: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  }, []);

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || isReordering) return;

      const activeId = parseFolderSortableId(active.id.toString());
      const overId = parseFolderSortableId(over.id.toString());
      if (!activeId || !overId || activeId === overId) return;

      const activeParent = parentByFolderId[activeId];
      const overParent = parentByFolderId[overId];
      if (!activeParent || !overParent || activeParent !== overParent) return;

      const currentSiblingIDs = siblingsByParent.get(activeParent) || [];
      const oldIndex = currentSiblingIDs.indexOf(activeId);
      const newIndex = currentSiblingIDs.indexOf(overId);
      if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) return;

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
    },
    [isReordering, parentByFolderId, refetch, siblingsByParent],
  );

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
        <div className="space-y-0.5">
          {rootFolders.length > 0 && (
            <SortableContext
              items={rootFolders.map((folder) =>
                getFolderSortableId(folder.id),
              )}
              strategy={verticalListSortingStrategy}
            >
              {rootFolders.map((folder) => (
                <FolderItem
                  key={folder.id}
                  folder={folder}
                  depth={0}
                  pathname={pathname}
                  isExpanded={expandedFolders.has(folder.id)}
                  isReordering={isReordering}
                  onToggle={toggleFolder}
                  expandedFolders={expandedFolders}
                />
              ))}
            </SortableContext>
          )}

          {rootNotes.map((note) => (
            <NoteItem key={note.id} note={note} depth={0} pathname={pathname} />
          ))}
        </div>
      )}
    </SidebarTreeSection>
  );
}

export default FileFolderTree;
