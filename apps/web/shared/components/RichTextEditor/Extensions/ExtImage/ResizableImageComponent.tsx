import React, { useState, useEffect } from "react";
import { NodeViewWrapper, NodeViewProps } from "@tiptap/react";
import ResizableMediaContainer, {
  type ResizeDimensions,
  type ResizeResult,
} from "../ResizableMediaContainer";
import Image from "next/image";

const ResizableImageComponent: React.FC<NodeViewProps> = ({
  node,
  selected,
  editor,
}) => {
  const [dimensions, setDimensions] = useState({
    width: node.attrs.width || "auto",
    height: node.attrs.height || "auto",
  });

  const [caption, setCaption] = useState(node.attrs.caption || "");
  const [isCaptionFocused, setIsCaptionFocused] = useState(false);

  useEffect(() => {
    setDimensions({
      width: node.attrs.width || "auto",
      height: node.attrs.height || "auto",
    });
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

  const handleResize = (nextDimensions: ResizeDimensions) => {
    setDimensions(nextDimensions);
  };

  const handleResizeEnd = ({ widthPx, heightPx }: ResizeResult) => {
    const finalDimensions = {
      width: widthPx,
      height: heightPx,
    };

    setDimensions(finalDimensions);
    editor.commands.updateAttributes("image", finalDimensions);
  };

  return (
    <NodeViewWrapper className="relative inline-block my-2 group">
      <figure className="inline-flex flex-col items-center">
        <ResizableMediaContainer
          width={dimensions.width}
          height={dimensions.height}
          selected={selected}
          isEditable={isEditable}
          onResize={handleResize}
          onResizeEnd={handleResizeEnd}
        >
          <Image
            src={node.attrs.src}
            alt={node.attrs.alt || ""}
            title={node.attrs.title || ""}
            width={1000}
            height={1000}
            style={{
              borderRadius: "8px",
              width: "100%",
              height: "100%",
              objectFit: "contain",
              display: "block",
            }}
          />
        </ResizableMediaContainer>

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
