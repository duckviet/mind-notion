// FolderPage.tsx
"use client";
import React, {
  useMemo,
  useState,
  useCallback,
  Fragment,
  useEffect,
} from "react";
import dynamic from "next/dynamic";
import { useFolder, useFolders } from "@/shared/hooks/useFolders";
import { useNotes } from "@/shared/hooks/useNotes";
import { SearchField } from "@/features/search-content";
import { EmptyState } from "@/shared/components/EmptyState";
import { ConfirmDialog } from "@/shared/components/ConfirmDialog/ConfirmDialog";
import {
  FolderOpen,
  FileText,
  HardDrive,
  Clock,
  Settings,
  MoreHorizontal,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useDebounce } from "use-debounce";
import {
  ReqUpdateNote,
  updateFolder,
  updateNoteTOM,
  useListNotesTOM,
} from "@/shared/services/generated/api";
import {
  BreadcrumbItemType,
  useBreadcrumb,
} from "@/shared/contexts/BreadcrumbContext";

const MasonryGrid = dynamic(
  () => import("@/widgets/content-grid").then((m) => m.MasonryGrid),
  { ssr: false },
);
const FocusEditModal = dynamic(
  () =>
    import("@/features/note-editing").then((mod) => ({
      default: mod.FocusEditModal,
    })),
  { ssr: false },
);
import NoteCard from "@/entities/note/ui/NoteCard";
import { AnimateCardProvider } from "@/entities/note/ui/AnimateCardProvider";
import { ModalProvider, useModal } from "@/shared/contexts/ModalContext";
import { FolderCard } from "@/shared/components/Folder";
import AddNoteForm from "@/features/add-note/ui/AddNoteForm";
import FoldersListPage from "./FoldersListPage";
import {
  DragEndEvent,
  DraggableItem,
  MultiZoneDndProvider,
} from "@/shared/components/dnd";
import DragAwareTomModal from "@/features/top-of-mind/ui/DragAwareTomModal";
import { TopOfMind } from "@/features/top-of-mind";

const SkeletonBlock = ({ className }: { className?: string }) => (
  <div
    className={`animate-pulse rounded-md bg-surface-elevated/50 ${className ?? ""}`}
  />
);

const GridSkeleton = ({ items = 6 }: { items?: number }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
    {Array.from({ length: items }).map((_, idx) => (
      <div key={idx} className="break-inside-avoid">
        <SkeletonBlock className="h-48 w-full" />
      </div>
    ))}
  </div>
);

const FolderHeaderSkeleton = () => (
  <div className="mb-8 space-y-4">
    <SkeletonBlock className="h-8 w-48" />
    <div className="flex gap-6">
      <SkeletonBlock className="h-5 w-24" />
      <SkeletonBlock className="h-5 w-24" />
      <SkeletonBlock className="h-5 w-32" />
    </div>
  </div>
);

interface FolderPageContentProps {
  folderId: string;
}

function FolderPageContent({ folderId }: FolderPageContentProps) {
  const [query, setQuery] = useState("");
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [focusEditNoteId, setFocusEditNoteId] = useState<string | null>(null);
  const { setItems: setBreadcrumbItems } = useBreadcrumb();
  const { isModalOpen, openModal, closeModal } = useModal();

  const [debouncedQuery] = useDebounce(query, 300);

  // Fetch folder details
  const {
    folder,
    isLoading: isFolderLoading,
    error: folderError,
    deleteFolder,
  } = useFolder(folderId);

  const { folders, refetch } = useFolders({
    limit: 50,
    offset: 0,
    parent_id: folderId,
  });

  // Fetch notes in this folder
  const {
    notes: notesData,
    isLoading: isNotesLoading,
    error: notesError,
    createNote,
    deleteNote,
    updateNote,
    refetch: refetchNotes,
  } = useNotes({
    limit: 50,
    offset: 0,
    query: debouncedQuery,
    folder_id: folderId,
  });

  const {
    data: topOfMindNotesData,
    isLoading: isLoadingTopOfMindNotes,
    error: errorTopOfMindNotes,
    refetch: refetchTopOfMindNotes,
  } = useListNotesTOM({
    query: {
      retry: false,
    },
  });

  const notes = useMemo(() => {
    return (notesData || []).map((note) => ({
      ...note,
      score: 1.0,
    }));
  }, [notesData]);

  const handleDeleteRequest = (id: string) => {
    setDeleteTargetId(id);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTargetId) return;
    setIsDeleting(true);
    try {
      await deleteNote(deleteTargetId);
    } catch (error) {
      console.error("Failed to delete note:", error);
    } finally {
      setIsDeleting(false);
      setDeleteTargetId(null);
    }
  };
  const handleUpdateTopOfMindNote = async (id: string, tom: boolean) => {
    try {
      // Strip "tom-" prefix if present (used for drag-and-drop identification)
      const normalizedId = id.startsWith("tom-") ? id.slice(4) : id;
      const noteId = normalizedId.startsWith("floating-")
        ? normalizedId.slice("floating-".length)
        : normalizedId;
      await updateNoteTOM(noteId, {
        tom,
      });
      refetchTopOfMindNotes();
      refetch();
    } catch (error) {
      console.error("Failed to update top of mind note:", error);
    }
  };
  const handleUpdate = async (id: string, data: ReqUpdateNote) => {
    try {
      await updateNote({ id, data });
    } catch (error) {
      console.error("Failed to update note:", error);
    }
  };

  const handleFocusEdit = useCallback(
    (noteId: string) => {
      setFocusEditNoteId(noteId);
      openModal();
    },
    [openModal],
  );

  const handleCloseFocusEdit = useCallback(() => {
    setFocusEditNoteId(null);
    closeModal();
    refetchNotes();
  }, [closeModal, refetchNotes]);

  const handleMoveToFolder = useCallback(
    async (id: string, folderId: string | null) => {
      try {
        await updateFolder(id, {
          parent_id: folderId || "",
        });
        refetch();
      } catch (error) {
        console.error("Failed to move folder:", error);
      }
    },
    [refetch],
  );

  const isLoading = isFolderLoading || isNotesLoading;
  const error = folderError || notesError;

  // Format dates
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    console.log("event", event);
    if (!over) return;

    const activeId = active.id.toString();
    const overId = over.id.toString();

    if (overId.startsWith("folder-")) {
      // Dropped onto a folder
      const folderId = overId.replace("folder-", "");
      console.log(`Dropped note ${activeId} onto folder ${folderId}`);
      // Remove from top of mind if it was there
      const activeNote = notes.filter((n) => n.id === activeId)[0];
      if (activeNote) {
        handleUpdate(activeId, { ...activeNote, folder_id: folderId });
      }
    }
  };

  if (folderError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <h2 className="text-xl font-semibold text-text-primary mb-2">
          Folder not found
        </h2>
        <p className="text-text-secondary mb-4">
          The folder you're looking for doesn't exist or has been deleted.
        </p>
        {/* <Link
          href="/"
          className="inline-flex items-center gap-2 text-accent hover:text-accent-600"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link> */}
      </div>
    );
  }

  return (
    <div className="">
      {/* Folder Header */}
      {isFolderLoading ? (
        <FolderHeaderSkeleton />
      ) : folder ? (
        <div className="mb-8">
          {/* Folder Title */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-surface-elevated rounded-xl">
                <FolderOpen className="w-6 h-6 text-text-primary" />
              </div>
              <h1 className="text-2xl font-bold text-text-primary">
                {folder.name}
              </h1>
              {folder.is_public && (
                <span className="px-2 py-1 text-xs font-medium bg-accent-100 text-accent-700 rounded-full">
                  Public
                </span>
              )}
            </div>
            <button className="p-2 hover:bg-surface-elevated rounded-lg transition-colors">
              <MoreHorizontal className="w-5 h-5 text-text-muted" />
            </button>
          </div>

          {/* Folder Stats */}
          <div className="flex flex-wrap gap-6 text-sm text-text-secondary">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              <span>{folder.notes?.length || 0} notes</span>
            </div>
            <div className="flex items-center gap-2">
              <FolderOpen className="w-4 h-4" />
              <span>{folder.children_folders?.length || 0} subfolders</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>Updated {formatDate(folder.updated_at)}</span>
            </div>
          </div>
        </div>
      ) : null}

      {/* Search */}
      <div className="mb-6">
        <SearchField query={query} setQuery={setQuery} onEnter={() => {}} />
      </div>

      {/* Notes Grid */}
      {isNotesLoading ? (
        <GridSkeleton items={6} />
      ) : (
        <MultiZoneDndProvider
          disabled={isModalOpen}
          onDragEnd={handleDragEnd}
          renderOverlay={(activeId) => {
            const noteId = activeId?.toString();
            const note = notes.find((n) => n.id === noteId) || null;
            return note ? (
              <div
                className="opacity-80 w-full min-w-[300px]"
                style={{ rotate: "5deg" }}
              >
                <NoteCard
                  match={{ ...note, score: 1.0 }}
                  onUpdateNote={() => {}}
                />
              </div>
            ) : null;
          }}
        >
          <AnimateCardProvider>
            <DragAwareTomModal isTomVisible={false}>
              <TopOfMind
                droppableId="top-of-mind-zone-floating"
                draggableIdPrefix="floating-"
                notes={topOfMindNotesData || []}
                onUnpin={handleUpdateTopOfMindNote}
                onFocusEdit={handleFocusEdit}
              />
            </DragAwareTomModal>
            <FoldersListPage parentId={folderId} />

            <MasonryGrid data={notes}>
              <AddNoteForm folder_id={folderId} onCreate={createNote} />
              {notes.map((note) => (
                <DraggableItem
                  className="h-fit mb-6 break-inside-avoid"
                  key={note.id}
                  id={note.id}
                >
                  <div key={note.id} className="break-inside-avoid ">
                    <NoteCard
                      match={note}
                      onDelete={handleDeleteRequest}
                      onUpdateNote={handleUpdate}
                      onFocusEdit={handleFocusEdit}
                    />
                  </div>
                </DraggableItem>
              ))}
            </MasonryGrid>
          </AnimateCardProvider>
        </MultiZoneDndProvider>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={!!deleteTargetId}
        onOpenChange={(open) => !open && setDeleteTargetId(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Note"
        description="Are you sure you want to delete this note? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        isConfirming={isDeleting}
        confirmVariant="destructive"
      />

      {/* Focus Edit Modal */}
      {isModalOpen && focusEditNoteId && (
        <FocusEditModal
          noteId={focusEditNoteId}
          isOpen={isModalOpen}
          onClose={handleCloseFocusEdit}
        />
      )}
    </div>
  );
}

interface FolderPageProps {
  folderId: string;
}

export default function FolderPage({ folderId }: FolderPageProps) {
  return (
    <ModalProvider>
      <FolderPageContent folderId={folderId} />
    </ModalProvider>
  );
}
