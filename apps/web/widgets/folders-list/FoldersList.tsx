// FoldersListPage.tsx
"use client";
import { useState, useCallback, forwardRef, useImperativeHandle } from "react";
import { useFolders } from "@/shared/hooks/useFolders";
import { ConfirmDialog } from "@/shared/components/ConfirmDialog/ConfirmDialog";
import { Plus } from "lucide-react";
import { ModalProvider } from "@/shared/contexts/ModalContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/shared/components/ui/dialog";
import { FolderCard } from "@/entities/folder";
import { Button } from "@/shared/components/ui/button";
import { updateFolder } from "@/shared/services/generated/api";
import { toast } from "sonner";
import { Input } from "@/shared/components/ui/input";
import { useQueryClient } from "@tanstack/react-query";
import { invalidateFoldersAfterUpdate } from "@/shared/hooks/query-invalidations";

const SkeletonBlock = ({ className }: { className?: string }) => (
  <div
    className={`animate-pulse rounded-lg bg-surface-100 ${className ?? ""}`}
  />
);

const GridSkeleton = ({ items = 6 }: { items?: number }) => (
  <div className="@container">
    <div className="grid grid-cols-1 @min-[360px]:grid-cols-2 @min-[540px]:grid-cols-3 @min-[720px]:grid-cols-4 @min-[900px]:grid-cols-5 @min-[1080px]:grid-cols-6 gap-6">
      {Array.from({ length: items }).map((_, idx) => (
        <div key={idx}>
          <SkeletonBlock className="h-40 w-full rounded-2xl" />
        </div>
      ))}
    </div>
  </div>
);

export interface FoldersListRef {
  openCreateModal: () => void;
}

interface FoldersListProps {
  parentId?: string;
  showHeader?: boolean;
}

const FoldersList = forwardRef<FoldersListRef, FoldersListProps>(
  ({ parentId, showHeader = true }, ref) => {
    const queryClient = useQueryClient();
    const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [folderName, setFolderName] = useState("");
    const [isCreating, setIsCreating] = useState(false);

    useImperativeHandle(ref, () => ({
      openCreateModal: () => {
        setIsCreateModalOpen(true);
      },
    }));

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
      await createFolder({
        name: folderName.trim(),
        parent_id: parentId || "",
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
        await invalidateFoldersAfterUpdate(queryClient, id);
        toast.success("Folder moved successfully");
        refetch();
      } catch (error) {
        console.error("Failed to move folder:", error);
      }
    },
    [refetch, queryClient],
  );

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-100 text-center">
        <h2 className="mb-2 font-serif text-heading-lg font-normal text-text-primary">
          Failed to load folders
        </h2>
        <p className="text-text-secondary mb-4">
          Something went wrong. Please try again.
        </p>
        <button
          onClick={() => refetch()}
          className="text-brand-600 hover:underline"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <ModalProvider>
      <div className="mb-8">
        {/* Header */}
        {showHeader && (
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="font-serif text-heading-lg font-normal text-text-primary">
                Folders
              </h1>
            </div>
            <Button
              onClick={handleCreateFolder}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="w-4 h-4" />
              <span>New Folder</span>
            </Button>
          </div>
        )}

        {/* Folders Grid */}
        {isLoading ? (
          <GridSkeleton items={8} />
        ) : (
          <div className="@container">
            <div className="grid w-full grid-cols-1 gap-6 @min-[360px]:grid-cols-2 @min-[540px]:grid-cols-3 @min-[720px]:grid-cols-4 @min-[900px]:grid-cols-5 @min-[1080px]:grid-cols-6">
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
          <DialogContent className="border border-border bg-surface-elevated sm:max-w-100">
            <DialogHeader>
              <DialogTitle>Create New Folder</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label
                  htmlFor="folder-name"
                  className="text-sm font-medium text-text-primary"
                >
                  Folder Name
                </label>
                <Input
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
                  className="rounded-lg border border-border px-3 py-2 text-lg focus:ring-2 focus:ring-ring/20"
                  autoFocus
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" onClick={() => setIsCreateModalOpen(false)}>
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleCreateFolderSubmit}
                disabled={!folderName.trim() || isCreating}
              >
                {isCreating ? "Creating..." : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ModalProvider>
  );
});

FoldersList.displayName = "FoldersList";

export default FoldersList;
