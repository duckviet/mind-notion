// FoldersListPage.tsx
"use client";
import { useState, useCallback } from "react";
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
import { FolderCard } from "@/shared/components/Folder";
import { Button } from "@/shared/components/ui/button";
import { updateFolder } from "@/shared/services/generated/api";
import { toast } from "sonner";
import { Input } from "@/shared/components/ui/input";

const SkeletonBlock = ({ className }: { className?: string }) => (
  <div
    className={`animate-pulse rounded-md  -elevated/50 ${className ?? ""}`}
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

const FoldersListPage = ({ parentId }: { parentId?: string }) => {
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
        toast.success("Folder moved successfully");
        refetch();
      } catch (error) {
        console.error("Failed to move folder:", error);
      }
    },
    [refetch],
  );

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <h2 className="text-xl font-semibold text-text-primary mb-2">
          Failed to load folders
        </h2>
        <p className="text-text-secondary mb-4">
          Something went wrong. Please try again.
        </p>
        <button
          onClick={() => refetch()}
          className="text-accent hover:text-accent-600"
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
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Folders</h1>
          </div>
          <Button
            onClick={handleCreateFolder}
            className="bg-accent text-text-primary hover:bg-accent-50"
          >
            <Plus className="w-4 h-4" />
            <span>New Folder</span>
          </Button>
        </div>

        {/* Folders Grid */}
        {isLoading ? (
          <GridSkeleton items={8} />
        ) : (
          <div className="grid grid-cols-6 w-full gap-6">
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
          <DialogContent className="sm:max-w-[400px]  bg-accent border border-border">
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
                  className="px-3 py-2 rounded-lg border border-border  focus:ring-2 focus:ring-accent   text-lg"
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
};

export default FoldersListPage;
