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
import { ReqUpdateNote } from "@/shared/services/generated/api";
import {
  BreadcrumbItemType,
  useBreadcrumb,
} from "@/shared/contexts/BreadcrumbContext";

const MasonryGrid = dynamic(
  () => import("@/widgets/content-grid").then((m) => m.MasonryGrid),
  { ssr: false }
);
const FocusEditModal = dynamic(
  () =>
    import("@/features/note-editing").then((mod) => ({
      default: mod.FocusEditModal,
    })),
  { ssr: false }
);
import NoteCard from "@/entities/note/ui/NoteCard";
import { AnimateCardProvider } from "@/entities/note/ui/AnimateCardProvider";
import { ModalProvider, useModal } from "@/shared/contexts/ModalContext";
import { FolderCard } from "@/shared/components/Folder";

const SkeletonBlock = ({ className }: { className?: string }) => (
  <div
    className={`animate-pulse rounded-md bg-slate-200/80 ${className ?? ""}`}
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
  const router = useRouter();
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
    deleteNote,
    updateNote,
    refetch: refetchNotes,
  } = useNotes({
    limit: 50,
    offset: 0,
    query: debouncedQuery,
    folder_id: folderId,
  });

  console.log(folderId, notesData);
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
    [openModal]
  );

  const handleCloseFocusEdit = useCallback(() => {
    setFocusEditNoteId(null);
    closeModal();
    refetchNotes();
  }, [closeModal, refetchNotes]);

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

  if (folderError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Folder not found
        </h2>
        <p className="text-gray-500 mb-4">
          The folder you're looking for doesn't exist or has been deleted.
        </p>
        {/* <Link
          href="/"
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link> */}
      </div>
    );
  }

  console.log(notes);
  return (
    <div className="p-6">
      {/* Folder Header */}
      {isFolderLoading ? (
        <FolderHeaderSkeleton />
      ) : folder ? (
        <div className="mb-8">
          {/* Folder Title */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-xl">
                <FolderOpen className="w-6 h-6 text-gray-700" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">
                {folder.name}
              </h1>
              {folder.is_public && (
                <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                  Public
                </span>
              )}
            </div>
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <MoreHorizontal className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Folder Stats */}
          <div className="flex flex-wrap gap-6 text-sm text-gray-500">
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
      ) : notes.length === 0 ? (
        <EmptyState
          type={query ? "no-results" : "new"}
          title={query ? "No notes found" : "No notes in this folder"}
          description={
            query
              ? "No notes match your search. Try a different query."
              : "Add notes to this folder to get started."
          }
        />
      ) : (
        <AnimateCardProvider>
          <MasonryGrid data={notes}>
            {folders.map((folder) => (
              <FolderCard
                key={folder.id}
                id={folder.id}
                name={folder.name}
                notesCount={folder.notes?.length || 0}
                subFoldersCount={folder.children_folders?.length || 0}
                updatedAt={folder.updated_at}
                isPublic={folder.is_public}
                onDelete={handleDeleteRequest}
              />
            ))}
            {notes.map((note) => (
              <div key={note.id} className="break-inside-avoid mb-6">
                <NoteCard
                  match={note}
                  onDelete={handleDeleteRequest}
                  onUpdateNote={handleUpdate}
                  onFocusEdit={handleFocusEdit}
                />
              </div>
            ))}
          </MasonryGrid>
        </AnimateCardProvider>
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
