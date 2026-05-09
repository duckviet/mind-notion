import {
  getGetEventByIdQueryKey,
  getGetFolderQueryKey,
  getGetNoteQueryKey,
  getGetTemplateQueryKey,
  getListEventsByRangeQueryKey,
  getListEventsQueryKey,
  getListFoldersQueryKey,
  getListNotesQueryKey,
  getListNotesTOMQueryKey,
  getListTemplatesQueryKey,
  ListEventsByRangeParams,
  ListEventsParams,
  ListFoldersParams,
  ListNotesParams,
} from "@/shared/services/generated/api";

export const notesKeys = {
  all: () => ["/notes"] as const,
  lists: () => getListNotesQueryKey(),
  list: (params?: ListNotesParams) => getListNotesQueryKey(params),
  detail: (noteId: string) => getGetNoteQueryKey(noteId),
  tom: () => getListNotesTOMQueryKey(),
};

export const foldersKeys = {
  all: () => ["/folders"] as const,
  lists: () => getListFoldersQueryKey(),
  list: (params?: ListFoldersParams) => getListFoldersQueryKey(params),
  detail: (folderId: string) => getGetFolderQueryKey(folderId),
};

export const eventsKeys = {
  all: () => ["/events"] as const,
  lists: () => getListEventsQueryKey(),
  list: (params?: ListEventsParams) => getListEventsQueryKey(params),
  ranges: () => ["/events/range"] as const,
  range: (params?: ListEventsByRangeParams) =>
    getListEventsByRangeQueryKey(params),
  detail: (eventId: string) => getGetEventByIdQueryKey(eventId),
};

export const templatesKeys = {
  all: () => ["/templates"] as const,
  lists: () => getListTemplatesQueryKey(),
  list: () => getListTemplatesQueryKey(),
  detail: (templateId: string) => getGetTemplateQueryKey(templateId),
};
