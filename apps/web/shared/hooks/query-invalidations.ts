import { QueryClient } from "@tanstack/react-query";
import {
  eventsKeys,
  foldersKeys,
  notesKeys,
  templatesKeys,
} from "./query-keys";

export async function invalidateNoteLists(queryClient: QueryClient) {
  await queryClient.invalidateQueries({ queryKey: notesKeys.lists() });
}

export async function invalidateNoteDetail(
  queryClient: QueryClient,
  noteId: string,
) {
  await queryClient.invalidateQueries({ queryKey: notesKeys.detail(noteId) });
}

export async function invalidateTopOfMindNotes(queryClient: QueryClient) {
  await queryClient.invalidateQueries({ queryKey: notesKeys.tom() });
}

export async function invalidateFolderLists(queryClient: QueryClient) {
  await queryClient.invalidateQueries({ queryKey: foldersKeys.lists() });
}

export async function invalidateFolderDetail(
  queryClient: QueryClient,
  folderId: string,
) {
  await queryClient.invalidateQueries({
    queryKey: foldersKeys.detail(folderId),
  });
}

export async function invalidateNotesAfterCreate(queryClient: QueryClient) {
  await Promise.all([
    invalidateNoteLists(queryClient),
    invalidateFolderLists(queryClient),
  ]);
}

export async function invalidateNotesAfterDelete(queryClient: QueryClient) {
  await Promise.all([
    invalidateNoteLists(queryClient),
    invalidateTopOfMindNotes(queryClient),
  ]);
}

export async function invalidateNotesAfterUpdate(
  queryClient: QueryClient,
  noteId: string,
) {
  await Promise.all([
    invalidateNoteLists(queryClient),
    invalidateNoteDetail(queryClient, noteId),
    invalidateTopOfMindNotes(queryClient),
    invalidateFolderLists(queryClient),
  ]);
}

export async function invalidateNotesAfterFolderChange(
  queryClient: QueryClient,
  noteId: string,
) {
  await Promise.all([
    invalidateNoteLists(queryClient),
    invalidateNotesAfterUpdate(queryClient, noteId),
    invalidateTopOfMindNotes(queryClient),
  ]);
}

export async function invalidateNotesAndFoldersAfterMove(
  queryClient: QueryClient,
  noteId: string,
) {
  await Promise.all([
    invalidateNoteLists(queryClient),
    invalidateNoteDetail(queryClient, noteId),
    invalidateTopOfMindNotes(queryClient),
    invalidateFolderLists(queryClient),
  ]);
}

export async function invalidateFoldersAfterCreate(queryClient: QueryClient) {
  await invalidateFolderLists(queryClient);
}

export async function invalidateFoldersAfterUpdate(
  queryClient: QueryClient,
  folderId: string,
) {
  await Promise.all([
    invalidateFolderLists(queryClient),
    invalidateFolderDetail(queryClient, folderId),
  ]);
}

export async function invalidateFoldersAfterDelete(
  queryClient: QueryClient,
  folderId: string,
) {
  await Promise.all([
    invalidateFolderLists(queryClient),
    invalidateFolderDetail(queryClient, folderId),
  ]);
}

export async function invalidateFoldersAfterAddNote(
  queryClient: QueryClient,
  folderId: string,
  noteId: string,
) {
  await Promise.all([
    invalidateFolderLists(queryClient),
    invalidateFolderDetail(queryClient, folderId),
    invalidateNotesAfterFolderChange(queryClient, noteId),
  ]);
}

export async function invalidateEventCollections(queryClient: QueryClient) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: eventsKeys.all() }),
    queryClient.invalidateQueries({ queryKey: eventsKeys.lists() }),
    queryClient.invalidateQueries({ queryKey: eventsKeys.ranges() }),
  ]);
}

export async function invalidateTemplateLists(queryClient: QueryClient) {
  await queryClient.invalidateQueries({ queryKey: templatesKeys.lists() });
}
