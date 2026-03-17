"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { NodeViewWrapper } from "@tiptap/react";
import { PencilRuler, PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import DrawingEditorModal, {
  type DrawingSavePayload,
} from "./DrawingEditorModal";

type UploadPreviewFn = (file: File) => Promise<string | null>;

type DrawingNodeViewProps = {
  node: {
    attrs: Record<string, unknown>;
  };
  selected: boolean;
  editor: {
    isEditable: boolean;
  };
  updateAttributes: (attributes: Record<string, unknown>) => void;
  extension: {
    options: Record<string, unknown>;
  };
};

const DrawingNodeView: React.FC<DrawingNodeViewProps> = ({
  node,
  selected,
  editor,
  updateAttributes,
  extension,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const hasOpenedRef = useRef(false);

  const drawingId = (node.attrs.drawingId as string) || "";
  const roomId = (node.attrs.roomId as string) || drawingId;
  const snapshot = (node.attrs.snapshot as string) || "";
  const previewUrl = (node.attrs.previewUrl as string) || "";
  const isEditable = editor.isEditable;

  const uploadPreviewFn = extension.options.uploadPreviewFn as
    | UploadPreviewFn
    | undefined;

  const syncUri = (extension.options.syncUri as string | undefined) || "";
  const maxSnapshotSize =
    (extension.options.maxSnapshotSize as number | undefined) || 1024 * 1024;

  const aspectRatio = useMemo(() => {
    const width = Number(node.attrs.width) || 16;
    const height = Number(node.attrs.height) || 9;

    return `${Math.max(width, 1)} / ${Math.max(height, 1)}`;
  }, [node.attrs.height, node.attrs.width]);

  useEffect(() => {
    if (hasOpenedRef.current) return;
    if (!isEditable) return;
    if (snapshot || previewUrl) return;

    hasOpenedRef.current = true;
    setIsModalOpen(true);
  }, [isEditable, previewUrl, snapshot]);

  const handleSave = (payload: DrawingSavePayload) => {
    updateAttributes({
      snapshot: payload.snapshot,
      previewUrl: payload.previewUrl || previewUrl,
      width: payload.width || node.attrs.width || 960,
      height: payload.height || node.attrs.height || 540,
      updatedAt: new Date().toISOString(),
      snapshotVersion: 1,
    });
  };

  return (
    <>
      <NodeViewWrapper
        className={cn(
          "my-3 overflow-hidden rounded-lg border border-border bg-white",
          selected && "ring-2 ring-accent/30",
        )}
      >
        <div contentEditable={false} className="space-y-3 p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium text-text-primary">
              <PencilRuler className="h-4 w-4" />
              Drawing
            </div>

            {isEditable && (
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center rounded-md border border-border px-2.5 py-1 text-xs text-text-primary hover:bg-muted"
              >
                {snapshot ? (
                  <>
                    <PencilRuler className="mr-1 h-3.5 w-3.5" />
                    Edit
                  </>
                ) : (
                  <>
                    <PlusCircle className="mr-1 h-3.5 w-3.5" />
                    Create
                  </>
                )}
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              if (isEditable) setIsModalOpen(true);
            }}
            className={cn(
              "relative block w-full overflow-hidden rounded-md border border-dashed border-border",
              isEditable && "hover:border-accent/60",
            )}
            style={{ aspectRatio }}
          >
            {previewUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={previewUrl}
                alt="Drawing preview"
                className="h-full w-full object-contain bg-surface-50"
                loading="lazy"
                decoding="async"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-surface-50 text-sm text-text-secondary">
                {snapshot
                  ? "Preview is unavailable, click Edit to open drawing"
                  : "No drawing yet, click Create to start"}
              </div>
            )}
          </button>
        </div>
      </NodeViewWrapper>

      <DrawingEditorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        drawingId={drawingId}
        roomId={roomId}
        initialSnapshot={snapshot}
        syncUri={syncUri}
        maxSnapshotSize={maxSnapshotSize}
        uploadPreviewFn={uploadPreviewFn}
      />
    </>
  );
};

export default DrawingNodeView;
