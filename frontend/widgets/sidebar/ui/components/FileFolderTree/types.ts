export type FolderNode = {
  id: string;
  name: string;
  parentId: string;
  order: number;
  children: FolderNode[];
  notes?: { id: string; name: string }[];
};

export type NoteNode = {
  id: string;
  name: string;
};
