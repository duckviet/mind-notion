"use client";

import React, { useCallback, useMemo, useRef, useState } from "react";
import { useSync } from "@tldraw/sync";
import {
  Tldraw,
  type Editor as TldrawEditor,
  type TLAsset,
  type TLAssetStore,
  getSnapshot,
  loadSnapshot,
} from "tldraw";
import { Loader2, Save, X } from "lucide-react";
import { toast } from "sonner";
import Portal from "@/shared/components/PortalModal/PortalModal";

export type DrawingSavePayload = {
  snapshot: string;
  previewUrl?: string;
  width?: number;
  height?: number;
};

type DrawingEditorModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: DrawingSavePayload) => void;
  drawingId: string;
  roomId: string;
  initialSnapshot?: string;
  syncUri?: string;
  maxSnapshotSize?: number;
  uploadPreviewFn?: (file: File) => Promise<string | null>;
};

const hydrateSnapshot = (editor: TldrawEditor, snapshot?: string) => {
  if (!snapshot) return;

  try {
    const document = JSON.parse(snapshot);
    loadSnapshot(editor.store, { document });
  } catch {
    toast.error("Could not load drawing data");
  }
};

const buildRoomUri = (syncUri: string, roomId: string) => {
  const normalized = syncUri.endsWith("/") ? syncUri.slice(0, -1) : syncUri;
  return `${normalized}/${roomId}`;
};

const tldrawAssetStore: TLAssetStore = {
  async upload(_asset: TLAsset, file: File) {
    return {
      src: URL.createObjectURL(file),
    };
  },
  resolve(asset: TLAsset) {
    return (asset.props as { src?: string }).src ?? null;
  },
};

const SyncCanvas = ({
  uri,
  initialSnapshot,
  onEditorReady,
}: {
  uri: string;
  initialSnapshot?: string;
  onEditorReady: (editor: TldrawEditor) => void;
}) => {
  const storeWithStatus = useSync({ uri, assets: tldrawAssetStore });

  if (storeWithStatus.status === "loading") {
    return (
      <div className="flex h-full items-center justify-center bg-surface-50 text-sm text-text-secondary">
        Connecting realtime room...
      </div>
    );
  }

  if (storeWithStatus.status === "error") {
    return (
      <div className="flex h-full items-center justify-center bg-surface-50 text-sm text-destructive">
        Could not connect to realtime room
      </div>
    );
  }

  return (
    <Tldraw
      store={storeWithStatus.store}
      onMount={(editor) => {
        if (editor.getCurrentPageShapes().length === 0) {
          hydrateSnapshot(editor, initialSnapshot);
        }
        onEditorReady(editor);
      }}
    />
  );
};

const LocalCanvas = ({
  initialSnapshot,
  onEditorReady,
}: {
  initialSnapshot?: string;
  onEditorReady: (editor: TldrawEditor) => void;
}) => {
  return (
    <Tldraw
      onMount={(editor) => {
        hydrateSnapshot(editor, initialSnapshot);
        onEditorReady(editor);
      }}
    />
  );
};

const DrawingEditorModal = ({
  isOpen,
  onClose,
  onSave,
  drawingId,
  roomId,
  initialSnapshot,
  syncUri,
  maxSnapshotSize = 1024 * 1024,
  uploadPreviewFn,
}: DrawingEditorModalProps) => {
  const editorRef = useRef<TldrawEditor | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const roomUri = useMemo(() => {
    if (!syncUri || !roomId) return "";
    return buildRoomUri(syncUri, roomId);
  }, [roomId, syncUri]);

  const handleSave = useCallback(async () => {
    const editor = editorRef.current;
    if (!editor) return;

    setIsSaving(true);

    try {
      const snapshot = getSnapshot(editor.store);
      const snapshotJson = JSON.stringify(snapshot.document);

      if (snapshotJson.length > maxSnapshotSize) {
        toast.error("Drawing is too large to save in this note");
        return;
      }

      let previewUrl: string | undefined;
      let width: number | undefined;
      let height: number | undefined;

      const exportResult = await editor.toImage(editor.getCurrentPageShapes(), {
        format: "png",
        pixelRatio: 2,
        background: true,
        padding: 24,
      });

      if (exportResult) {
        width = exportResult.width;
        height = exportResult.height;

        if (uploadPreviewFn) {
          const file = new File([exportResult.blob], `${drawingId}.png`, {
            type: "image/png",
          });
          previewUrl = (await uploadPreviewFn(file)) || undefined;
        }
      }

      onSave({
        snapshot: snapshotJson,
        previewUrl,
        width,
        height,
      });
      onClose();
    } catch (error) {
      console.error("Failed to save drawing", error);
      toast.error("Failed to save drawing");
    } finally {
      setIsSaving(false);
    }
  }, [drawingId, maxSnapshotSize, onClose, onSave, uploadPreviewFn]);

  if (!isOpen) return null;

  return (
    <Portal lockScroll={true}>
      <div
        className="fixed inset-0 z-100 bg-black/40"
        onMouseDown={(event) => {
          event.stopPropagation();
          if (!isSaving) onClose();
        }}
      />

      <div className="fixed inset-0 z-100 p-4 sm:p-6">
        <div className="mx-auto flex h-full max-w-7xl flex-col overflow-hidden rounded-xl border border-border bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-text-primary">
                Drawing board
              </p>
              <p className="text-xs text-text-secondary">
                {roomUri
                  ? "Realtime collaboration is active"
                  : "Realtime is unavailable, running local mode"}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSaving}
                className="inline-flex h-9 items-center justify-center rounded-md border border-border px-3 text-sm text-text-primary hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
              >
                <X className="mr-1 h-4 w-4" />
                Close
              </button>

              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="inline-flex h-9 items-center justify-center rounded-md bg-accent px-3 text-sm font-medium text-text-primary hover:bg-accent-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSaving ? (
                  <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-1 h-4 w-4" />
                )}
                Save drawing
              </button>
            </div>
          </div>

          <div className="relative min-h-0 flex-1">
            {roomUri ? (
              <SyncCanvas
                uri={roomUri}
                initialSnapshot={initialSnapshot}
                onEditorReady={(editor) => {
                  editorRef.current = editor;
                }}
              />
            ) : (
              <LocalCanvas
                initialSnapshot={initialSnapshot}
                onEditorReady={(editor) => {
                  editorRef.current = editor;
                }}
              />
            )}
          </div>
        </div>
      </div>
    </Portal>
  );
};

export default DrawingEditorModal;
