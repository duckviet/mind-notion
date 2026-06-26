"use client";

import React, { useEffect, useState } from "react";
import { NodeViewProps, NodeViewWrapper } from "@tiptap/react";
import { Check, X } from "lucide-react";
import { cn } from "../../utils/cn";
import { highlightCode } from "../CodeBlockShiki/highlighter";

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
  const contextType = (node.attrs.contextType as string) || "paragraph";
  const codeLanguage = (node.attrs.codeLanguage as string) || "";
  const headingLevel = (node.attrs.headingLevel as number) || 1;

  const isCode = contextType === "codeBlock";

  const [originalHtml, setOriginalHtml] = useState<string>("");
  const [proposedHtml, setProposedHtml] = useState<string>("");

  // Retrieve themes from editor extensions options
  const codeBlockOptions = editor?.extensionManager?.extensions
    ?.find((ext: any) => ext.name === "codeBlock")
    ?.options;
  const themes = codeBlockOptions?.themes ?? null;
  const defaultTheme = codeBlockOptions?.defaultTheme ?? "github-dark";

  useEffect(() => {
    if (!isCode) return;

    const isDark = typeof document !== "undefined" && document.documentElement.classList.contains("dark");
    const resolvedTheme = themes
      ? isDark ? themes.dark : themes.light
      : isDark ? defaultTheme : ("github-light" as any);

    const escapeHtmlFallback = (str: string): string => {
      return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
    };

    const tryHighlight = () => {
      // Pass null to themes to force a single theme resolution
      const oHtml = highlightCode(originalText, codeLanguage, null, resolvedTheme);
      const pHtml = highlightCode(proposedText, codeLanguage, null, resolvedTheme);

      if (oHtml !== escapeHtmlFallback(originalText)) {
        setOriginalHtml(oHtml);
        setProposedHtml(pHtml);
        return true;
      }
      return false;
    };

    if (!tryHighlight()) {
      const timer = setTimeout(tryHighlight, 300);
      return () => clearTimeout(timer);
    }
  }, [isCode, originalText, proposedText, codeLanguage, themes, defaultTheme]);

  useEffect(() => {
    if (!isCode) return;

    const observer = new MutationObserver(() => {
      setOriginalHtml("");
      setProposedHtml("");
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, [isCode]);

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

  const renderContent = (text: string, isOriginal: boolean) => {
    const classNames = cn(
      isOriginal ? "proposed-edit-original" : "proposed-edit-proposed",
      isOriginal ? "" : "mt-2",
      "px-3 py-2 rounded-md block transition-colors"
    );

    if (contextType === "codeBlock") {
      const html = isOriginal ? originalHtml : proposedHtml;
      if (html) {
        return (
          <div
            className={cn(classNames, "shiki-proposed overflow-x-auto font-mono text-sm leading-relaxed")}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        );
      }
      return (
        <pre
          className={cn(
            classNames,
            "shiki-proposed font-mono text-sm overflow-x-auto whitespace-pre leading-relaxed"
          )}
        >
          <code className={codeLanguage ? `language-${codeLanguage}` : undefined}>
            {text}
          </code>
        </pre>
      );
    }

    if (contextType === "heading") {
      const HeadingTag = `h${headingLevel}` as "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
      return (
        <HeadingTag className={cn(classNames, "font-bold font-serif leading-tight")}>
          {text}
        </HeadingTag>
      );
    }

    if (contextType === "blockquote") {
      return (
        <blockquote className={cn(classNames, "pl-4 border-l-4 border-gray-300 italic")}>
          {text}
        </blockquote>
      );
    }

    return (
      <p
        data-original={isOriginal ? "true" : undefined}
        data-proposed={!isOriginal ? "true" : undefined}
        className={cn(
          isOriginal ? "proposed-edit-original" : "proposed-edit-proposed mt-2",
          "whitespace-pre-wrap wrap-break-word px-1"
        )}
      >
        {text}
      </p>
    );
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

      {renderContent(originalText, true)}
      {renderContent(proposedText, false)}
    </NodeViewWrapper>
  );
};

export default ProposedEditNodeView;
