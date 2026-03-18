export const ROOT_PARENT_KEY = "__root__";
export const FOLDER_SORTABLE_PREFIX = "tree-folder-sort-";

export function getFolderSortableId(folderId: string): string {
  return `${FOLDER_SORTABLE_PREFIX}${folderId}`;
}

export function parseFolderSortableId(sortableId: string): string | null {
  if (!sortableId.startsWith(FOLDER_SORTABLE_PREFIX)) {
    return null;
  }
  return sortableId.slice(FOLDER_SORTABLE_PREFIX.length);
}

export function isFolderRoute(pathname: string, folderId: string): boolean {
  return pathname === `/folder/${folderId}`;
}

export function isNoteRoute(pathname: string, noteId: string): boolean {
  return (
    pathname === `/note/${noteId}` || pathname.startsWith(`/note/${noteId}/`)
  );
}
