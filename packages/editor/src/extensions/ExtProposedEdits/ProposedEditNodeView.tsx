"use client";

import React from "react";
import { NodeViewProps, NodeViewWrapper } from "@tiptap/react";
import { Check, X } from "lucide-react";
import { cn } from "../../utils/cn";

const ProposedEditNodeView: React.FC<NodeViewProps> = ({
  node,
  editor,
  getPos,
  selected,
}) => {
  const originalText = (node.attrs.originalText as string) || "";
  const proposedText = (node.attrs.proposedText as string) || "";
  const createdAt = (node.attrs.createdAt as number) || 0;
  const createdBy = (node.attrs.createdBy as string) || "";

  const date = createdAt
    ? new Date(createdAt).toLocaleString(undefined, {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

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
        selected && "ring-1 ring-brand-600/40",
      )}
    >
      <div className="absolute right-2 -top-2 z-10 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <div className="flex items-center gap-2 rounded-lg border border-border bg-accent px-2 py-1 text-xs">
          <span className="font-semibold">{createdBy}</span>
          <span className="text-[10px] text-muted-foreground">{date}</span>
        </div>
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
        className="proposed-edit-original whitespace-pre-wrap wrap-break-word px-1"
      >
        {originalText}
      </p>

      <p
        data-proposed="true"
        className="proposed-edit-proposed mt-2 whitespace-pre-wrap wrap-break-word px-1"
      >
        {proposedText}
      </p>
    </NodeViewWrapper>
  );
};

export default ProposedEditNodeView;
