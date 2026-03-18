"use client";

import React, { useEffect, useRef, useState } from "react";
import { NodeViewProps, NodeViewWrapper } from "@tiptap/react";
import { PencilRuler, PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import DrawingEditorModal, {
  type DrawingSavePayload,
} from "./DrawingEditorModal";
import ResizableMediaContainer, {
  type ResizeDimensions,
  type ResizeResult,
} from "../ResizableMediaContainer";

type UploadPreviewFn = (file: File) => Promise<string | null>;

const parseDimension = (value: unknown, fallback: number) => {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return Math.round(value);
  }

  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    if (Number.isFinite(parsed) && parsed > 0) {
      return Math.round(parsed);
    }
  }

  return fallback;
};

const DrawingNodeView: React.FC<NodeViewProps> = ({
  node,
  selected,
  editor,
  updateAttributes,
  extension,
}) => {
  const [dimensions, setDimensions] = useState({
    width: node.attrs.width || "auto",
    height: node.attrs.height || "auto",
  });
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

  useEffect(() => {
    if (hasOpenedRef.current) return;
    if (!isEditable) return;
    if (snapshot || previewUrl) return;

    hasOpenedRef.current = true;
    setIsModalOpen(true);
  }, [isEditable, previewUrl, snapshot]);

  useEffect(() => {
    setDimensions({
      width: node.attrs.width || "auto",
      height: node.attrs.height || "auto",
    });
  }, [node.attrs.width, node.attrs.height]);

  const handleSave = (payload: DrawingSavePayload) => {
    const currentWidth = parseDimension(
      dimensions.width,
      parseDimension(node.attrs.width, 960),
    );
    const currentHeight = parseDimension(
      dimensions.height,
      parseDimension(node.attrs.height, 540),
    );

    updateAttributes({
      snapshot: payload.snapshot,
      previewUrl: payload.previewUrl || previewUrl,
      // Keep the outer frame size stable; preview image will be fit-scaled inside it.
      width: currentWidth,
      height: currentHeight,
      updatedAt: new Date().toISOString(),
      snapshotVersion: 1,
    });
  };

  const handleResize = (nextDimensions: ResizeDimensions) => {
    setDimensions(nextDimensions);
  };

  const handleResizeEnd = ({
    width,
    height,
    widthPx,
    heightPx,
  }: ResizeResult) => {
    const finalDimensions = {
      width: widthPx,
      height: heightPx,
    };

    setDimensions(finalDimensions);
    updateAttributes({
      width,
      height,
      updatedAt: new Date().toISOString(),
    });
  };
  return (
    <>
      <NodeViewWrapper
        className={cn(
          "my-3 overflow-hidden relative group",
          selected && "ring-2 ring-accent/30",
        )}
      >
        <ResizableMediaContainer
          width={dimensions.width}
          height={dimensions.height}
          selected={selected}
          isEditable={isEditable}
          minWidth={240}
          minHeight={160}
          onResize={handleResize}
          onResizeEnd={handleResizeEnd}
        >
          <div className="flex items-center justify-between absolute top-0 left-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
            <div className="inline-flex items-center rounded-md border border-border px-2.5 py-1 text-xs text-text-primary hover:bg-muted gap-2">
              <PencilRuler className="h-4 w-4" />
              Drawing
            </div>

            {isEditable && (
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="pointer-events-auto inline-flex items-center rounded-md border border-border px-2.5 py-1 text-xs text-text-primary hover:bg-muted"
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
          <div
            className={cn(
              "relative block h-full w-full overflow-hidden rounded-md border border-dashed border-border",
              isEditable && "hover:border-accent/60",
            )}
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
          </div>
        </ResizableMediaContainer>
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
