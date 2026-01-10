// FoldersListPage.tsx
"use client";
import { useState, useCallback } from "react";
import { useFolders } from "@/shared/hooks/useFolders";
import { EmptyState } from "@/shared/components/EmptyState";
import { ConfirmDialog } from "@/shared/components/ConfirmDialog/ConfirmDialog";
import { FolderOpen, Plus, MoreHorizontal, Trash2, Edit } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ModalProvider, useModal } from "@/shared/contexts/ModalContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/shared/components/ui/dialog";
import { Card } from "@/shared/components/Card";
import { FolderCard } from "@/shared/components/Folder";
import { Button } from "@/shared/components/ui/button";
import { updateFolder } from "@/shared/services/generated/api";
import { toast } from "sonner";

const SkeletonBlock = ({ className }: { className?: string }) => (
  <div
    className={`animate-pulse rounded-md bg-slate-200/80 ${className ?? ""}`}
  />
);

const GridSkeleton = ({ items = 6 }: { items?: number }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
    {Array.from({ length: items }).map((_, idx) => (
      <div key={idx}>
        <SkeletonBlock className="h-40 w-full rounded-2xl" />
      </div>
    ))}
  </div>
);

function FoldersListPageContent({ parentId }: { parentId?: string }) {
  const router = useRouter();
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const { folders, isLoading, error, deleteFolder, createFolder, refetch } =
    useFolders({ limit: 50, offset: 0, parent_id: parentId || "" });

  const handleDeleteRequest = (id: string) => {
    setDeleteTargetId(id);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTargetId) return;
    setIsDeleting(true);
    try {
      await deleteFolder(deleteTargetId);
      refetch();
    } catch (error) {
      console.error("Failed to delete folder:", error);
    } finally {
      setIsDeleting(false);
      setDeleteTargetId(null);
    }
  };

  const handleCreateFolder = async () => {
    setIsCreateModalOpen(true);
  };

  const handleCreateFolderSubmit = async () => {
    if (!folderName.trim()) return;
    setIsCreating(true);
    try {
      const newFolder = await createFolder({
        name: folderName.trim(),
        parent_id: "",
        is_public: false,
      });
      setFolderName("");
      setIsCreateModalOpen(false);
      refetch();
    } catch (error) {
      console.error("Failed to create folder:", error);
    } finally {
      setIsCreating(false);
    }
  };
  const handleMoveToFolder = useCallback(
    async (id: string, folderId: string | null) => {
      try {
        await updateFolder(id, {
          parent_id: folderId || "",
        });
        toast.success("Folder moved successfully");
        refetch();
      } catch (error) {
        console.error("Failed to move folder:", error);
      }
    },
    [refetch]
  );

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Failed to load folders
        </h2>
        <p className="text-gray-500 mb-4">
          Something went wrong. Please try again.
        </p>
        <button
          onClick={() => refetch()}
          className="text-blue-600 hover:text-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="mb-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Folders</h1>
        </div>
        <Button
          onClick={handleCreateFolder}
          className="inline-flex bg-white items-center gap-2 px-4 py-2 rounded-lg  transition-colors hover:bg-white/90 hover:shadow-md cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Folder</span>
        </Button>
      </div>

      {/* Folders Grid */}
      {isLoading ? (
        <GridSkeleton items={8} />
      ) : folders.length === 0 ? (
        <EmptyState
          type="new"
          title="No folders yet"
          description="Create your first folder to organize your notes."
          action={{
            label: "Create Folder",
            onClick: handleCreateFolder,
          }}
        />
      ) : (
        <div className="flex w-full gap-6">
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
              onMoveToFolder={(toFolderId) => {
                console.log("Move folder", folder.id, toFolderId);

                handleMoveToFolder(folder.id, toFolderId);
              }}
            />
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={!!deleteTargetId}
        onOpenChange={(open) => !open && setDeleteTargetId(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Folder"
        description="Are you sure you want to delete this folder? All notes inside will be moved to the root level."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        isConfirming={isDeleting}
        confirmVariant="destructive"
      />

      {/* Create Folder Dialog */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="sm:max-w-[400px] bg-white border-none">
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label
                htmlFor="folder-name"
                className="text-sm font-medium text-gray-700"
              >
                Folder Name
              </label>
              <input
                id="folder-name"
                type="text"
                placeholder="Enter folder name"
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && folderName.trim()) {
                    handleCreateFolderSubmit();
                  }
                }}
                className="px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCreateFolderSubmit}
              disabled={!folderName.trim() || isCreating}
              className="px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreating ? "Creating..." : "Create"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function FoldersListPage() {
  return (
    <ModalProvider>
      <FoldersListPageContent />
    </ModalProvider>
  );
}
