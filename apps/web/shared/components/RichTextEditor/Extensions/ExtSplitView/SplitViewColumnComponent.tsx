"use client";

import React from "react";
import { NodeViewWrapper, NodeViewContent, NodeViewProps } from "@tiptap/react";
import { cn } from "@/lib/utils";

const SplitViewColumnComponent: React.FC<NodeViewProps> = ({}) => {
  return (
    <NodeViewWrapper
      as="div"
      className={cn("split-view-column-wrapper")}

      //   data-position={position}
    >
      <NodeViewContent className="split-view-column-content outline-none" />
    </NodeViewWrapper>
  );
};

export default SplitViewColumnComponent;
