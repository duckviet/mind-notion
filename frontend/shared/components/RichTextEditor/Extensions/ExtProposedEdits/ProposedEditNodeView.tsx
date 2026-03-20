"use client";

import React from "react";
import { NodeViewProps, NodeViewWrapper } from "@tiptap/react";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

const ProposedEditNodeView: React.FC<NodeViewProps> = ({
  node,
  editor,
  getPos,
  selected,
}) => {
  const originalText = (node.attrs.originalText as string) || "";
  const proposedText = (node.attrs.proposedText as string) || "";

  const resolvePos = () => {
    const position = typeof getPos === "function" ? getPos() : null;
    return typeof position === "number" ? position : undefined;
  };

  const handleAccept = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    editor.commands.acceptProposedEdit(resolvePos());
  };

  const handleReject = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    editor.commands.rejectProposedEdit(resolvePos());
  };

  return (
    <NodeViewWrapper
      data-type="proposed-edit"
      data-original={originalText}
      data-proposed={proposedText}
      className={cn(
        "group relative mx-1",
        // "border border-amber-300/70 bg-amber-50/70 p-3 dark:border-amber-500/30 dark:bg-amber-500/10",
        selected && "ring-1 ring-amber-500/40",
      )}
    >
      <div className="absolute right-2 -top-2 z-10 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          type="button"
          onClick={handleReject}
          className="inline-flex items-center gap-1 rounded-md border border-border bg-accent px-2 py-1 text-xs hover:bg-accent"
        >
          <X className="h-3 w-3" />
          Reject
        </button>
        <button
          type="button"
          onClick={handleAccept}
          className="inline-flex items-center gap-1 rounded-md border border-border bg-primary px-2 py-1 text-xs text-primary-foreground hover:bg-primary/90"
        >
          <Check className="h-3 w-3" />
          Accept
        </button>
      </div>

      <p
        data-original="true"
        className="whitespace-pre-wrap break-words px-1  bg-rose-100/80   text-rose-900 dark:bg-rose-500/20 dark:text-rose-200"
      >
        {originalText}
      </p>

      <p
        data-proposed="true"
        className="mt-2 whitespace-pre-wrap break-words px-1  bg-emerald-100/80   text-emerald-900 dark:bg-emerald-500/20 dark:text-emerald-200"
      >
        {proposedText}
      </p>
    </NodeViewWrapper>
  );
};

export default ProposedEditNodeView;
