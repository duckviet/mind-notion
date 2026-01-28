import React, { useRef, useState, useEffect } from "react";
import { NodeViewWrapper, NodeViewProps } from "@tiptap/react";

const ResizableImageComponent: React.FC<NodeViewProps> = ({
  node,
  updateAttributes,
  selected,
  editor,
}) => {
  const imageRef = useRef<HTMLImageElement>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState({
    width: node.attrs.width || "auto",
    height: node.attrs.height || "auto",
  });

  console.log("Image node attrs:", node.attrs, dimensions);

  const [caption, setCaption] = useState(node.attrs.caption || "");
  const [isCaptionFocused, setIsCaptionFocused] = useState(false);

  const startResize = (
    e: React.MouseEvent<HTMLDivElement>,
    direction: string,
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    setResizeDirection(direction);

    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = imageRef.current?.offsetWidth || 0;
    const startHeight = imageRef.current?.offsetHeight || 0;
    let currentWidth = startWidth;
    let currentHeight = startHeight;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!imageRef.current) return;

      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;

      let newWidth = startWidth;
      let newHeight = startHeight;

      if (direction.includes("e")) {
        newWidth = Math.max(50, startWidth + deltaX);
      }
      if (direction.includes("w")) {
        newWidth = Math.max(50, startWidth - deltaX);
      }
      if (direction.includes("s")) {
        newHeight = Math.max(50, startHeight + deltaY);
      }
      if (direction.includes("n")) {
        newHeight = Math.max(50, startHeight - deltaY);
      }

      // Maintain aspect ratio for corner handles
      if (direction.length === 2) {
        const aspectRatio = startWidth / startHeight;
        newHeight = newWidth / aspectRatio;
      }

      newWidth = Math.round(newWidth);
      newHeight = Math.round(newHeight);
      currentWidth = newWidth;
      currentHeight = newHeight;

      setDimensions({
        width: `${newWidth}px`,
        height: `${newHeight}px`,
      });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      setResizeDirection(null);
      // Use the final calculated dimensions, not the state which may lag
      const finalDimensions = {
        width: `${currentWidth}px`,
        height: `${currentHeight}px`,
      };
      editor.commands.updateAttributes("image", finalDimensions);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  useEffect(() => {
    if (node.attrs.width || node.attrs.height) {
      setDimensions({
        width: node.attrs.width || "auto",
        height: node.attrs.height || "auto",
      });
    }
  }, [node.attrs.width, node.attrs.height]);

  useEffect(() => {
    setCaption(node.attrs.caption || "");
  }, [node.attrs.caption]);

  const handleCaptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newCaption = e.target.value;
    setCaption(newCaption);
    // Use editor.commands to trigger update event
    editor.commands.updateAttributes("image", { caption: newCaption });
  };

  const isEditable = editor.isEditable;

  return (
    <NodeViewWrapper className="relative inline-block my-2 group">
      <figure className="inline-flex flex-col items-center">
        <div
          className={`relative inline-block ${
            selected ? "ring-2 ring-blue-500 rounded" : ""
          }`}
          style={{
            width: dimensions.width,
            height: dimensions.height,
          }}
        >
          <img
            ref={imageRef}
            src={node.attrs.src}
            alt={node.attrs.alt || ""}
            title={node.attrs.title || ""}
            style={{
              borderRadius: "8px",
              width: "100%",
              height: "100%",
              objectFit: "contain",
              display: "block",
            }}
          />

          {/* Resize Handles - Only show when selected and editable */}
          {selected && isEditable && (
            <>
              {/* Corner Handles */}
              <div
                className="absolute top-0 left-0 w-3 h-3 bg-blue-500 border border-white rounded-full cursor-nwse-resize -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                onMouseDown={(e) => startResize(e, "nw")}
              />
              <div
                className="absolute top-0 right-0 w-3 h-3 bg-blue-500 border border-white rounded-full cursor-nesw-resize translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                onMouseDown={(e) => startResize(e, "ne")}
              />
              <div
                className="absolute bottom-0 left-0 w-3 h-3 bg-blue-500 border border-white rounded-full cursor-nesw-resize -translate-x-1/2 translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                onMouseDown={(e) => startResize(e, "sw")}
              />
              <div
                className="absolute bottom-0 right-0 w-3 h-3 bg-blue-500 border border-white rounded-full cursor-nwse-resize translate-x-1/2 translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                onMouseDown={(e) => startResize(e, "se")}
              />

              {/* Edge Handles */}
              <div
                className="absolute top-1/2 left-0 w-3 h-6 bg-blue-500 border border-white rounded-r cursor-ew-resize -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                onMouseDown={(e) => startResize(e, "w")}
              />
              <div
                className="absolute top-1/2 right-0 w-3 h-6 bg-blue-500 border border-white rounded-l cursor-ew-resize translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                onMouseDown={(e) => startResize(e, "e")}
              />
              <div
                className="absolute top-0 left-1/2 w-6 h-3 bg-blue-500 border border-white rounded-b cursor-ns-resize -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                onMouseDown={(e) => startResize(e, "n")}
              />
              <div
                className="absolute bottom-0 left-1/2 w-6 h-3 bg-blue-500 border border-white rounded-t cursor-ns-resize -translate-x-1/2 translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                onMouseDown={(e) => startResize(e, "s")}
              />
            </>
          )}

          {/* Resize indicator */}
          {isResizing && (
            <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded pointer-events-none">
              {dimensions.width} x {dimensions.height}
            </div>
          )}
        </div>

        {/* Caption Input */}
        {isEditable ? (
          <input
            type="text"
            value={caption}
            onChange={handleCaptionChange}
            onFocus={() => setIsCaptionFocused(true)}
            onBlur={() => setIsCaptionFocused(false)}
            placeholder="Add a caption..."
            className={`
              mt-1 w-full text-center text-xs text-muted-foreground
              bg-transparent border-none outline-none
              placeholder:text-muted-foreground/50
              focus:placeholder:text-muted-foreground/30
              ${!caption && !isCaptionFocused && !selected ? "opacity-0 group-hover:opacity-100" : "opacity-100"}
              transition-opacity duration-200
            `}
            style={{
              maxWidth: dimensions.width !== "auto" ? dimensions.width : "100%",
            }}
          />
        ) : (
          caption && (
            <figcaption
              className="mt-2 text-center text-sm text-muted-foreground italic"
              style={{
                maxWidth:
                  dimensions.width !== "auto" ? dimensions.width : "100%",
              }}
            >
              {caption}
            </figcaption>
          )
        )}
      </figure>
    </NodeViewWrapper>
  );
};

export default ResizableImageComponent;
