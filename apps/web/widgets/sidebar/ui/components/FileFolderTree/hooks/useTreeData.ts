import { useMemo } from "react";
import { FolderNode, NoteNode } from "../types";
import { ROOT_PARENT_KEY } from "../utils";

export function useTreeData(folders: any[], notes: any[]) {
  return useMemo(() => {
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
        notes: folder.notes || [],
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

    const grouped = new Map<string, NoteNode[]>();
    const loose: NoteNode[] = [];

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

    for (const [folderId, folderNotes] of grouped) {
      if (map[folderId]) {
        map[folderId].notes = folderNotes;
      }
    }
    return {
      rootFolders: roots,
      notesByFolder: grouped,
      rootNotes: loose,
      parentByFolderId: parentMap,
      siblingsByParent: siblingsMap,
    };
  }, [folders, notes]);
}
