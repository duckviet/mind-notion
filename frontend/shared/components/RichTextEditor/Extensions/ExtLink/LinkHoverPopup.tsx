// components/link-hover-popup.tsx
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Editor } from "@tiptap/react";
import { ExternalLink, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/shared/components/ui/button";

interface LinkHoverPopupProps {
  editor: Editor;
  onEdit?: (href: string, text: string, from: number, to: number) => void;
}

interface PopupState {
  href: string;
  x: number;
  y: number;
}

const LinkHoverPopup = ({ editor, onEdit }: LinkHoverPopupProps) => {
  const [popup, setPopup] = useState<PopupState | null>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const hoverTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isOverPopup = useRef(false);
  const isOverLink = useRef(false);
  const currentAnchor = useRef<HTMLAnchorElement | null>(null);

  const show = useCallback((anchor: HTMLAnchorElement) => {
    const href = anchor.getAttribute("href");
    if (!href) return;

    const rect = anchor.getBoundingClientRect();
    setPopup({
      href,
      x: rect.left + rect.width / 2,
      y: rect.bottom + 6,
    });
    currentAnchor.current = anchor;
  }, []);

  const scheduleHide = useCallback(() => {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    hoverTimeout.current = setTimeout(() => {
      if (!isOverPopup.current && !isOverLink.current) {
        setPopup(null);
        currentAnchor.current = null;
      }
    }, 150);
  }, []);

  useEffect(() => {
    const editorEl = editor.view.dom;

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest("a") as HTMLAnchorElement | null;

      if (anchor && editorEl.contains(anchor)) {
        isOverLink.current = true;
        if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
        show(anchor);
      }
    };

    const handleMouseOut = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest("a") as HTMLAnchorElement | null;

      if (anchor && editorEl.contains(anchor)) {
        const related = e.relatedTarget as Node | null;
        if (related && anchor.contains(related)) return;
        isOverLink.current = false;
        scheduleHide();
      }
    };

    editorEl.addEventListener("mouseover", handleMouseOver);
    editorEl.addEventListener("mouseout", handleMouseOut);

    return () => {
      editorEl.removeEventListener("mouseover", handleMouseOver);
      editorEl.removeEventListener("mouseout", handleMouseOut);
      if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    };
  }, [editor, show, scheduleHide]);

  const handlePopupEnter = useCallback(() => {
    isOverPopup.current = true;
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
  }, []);

  const handlePopupLeave = useCallback(() => {
    isOverPopup.current = false;
    scheduleHide();
  }, [scheduleHide]);

  const handleOpen = useCallback(() => {
    if (popup?.href) window.open(popup.href, "_blank");
  }, [popup]);

  const handleRemove = useCallback(() => {
    if (!currentAnchor.current) return;

    // Find the position of this link in the document
    const pos = editor.view.posAtDOM(currentAnchor.current, 0);
    const $pos = editor.state.doc.resolve(pos);
    const linkMark = editor.state.schema.marks.link;
    const range = $pos.marks().find((m) => m.type === linkMark);

    if (range) {
      editor
        .chain()
        .focus()
        .setTextSelection(pos)
        .extendMarkRange("link")
        .unsetLink()
        .run();
    }

    setPopup(null);
    currentAnchor.current = null;
  }, [editor]);

  const handleEdit = useCallback(() => {
    if (!currentAnchor.current || !onEdit) return;

    const anchor = currentAnchor.current;
    const href = anchor.getAttribute("href") || "";
    const pos = editor.view.posAtDOM(anchor, 0);

    // Resolve mark range
    const $pos = editor.state.doc.resolve(pos);
    const markRange = (() => {
      const { doc } = editor.state;
      const resolved = doc.resolve(pos);
      const start = resolved.start();
      let from = pos;
      let to = pos;

      // Walk backward
      while (
        from > start &&
        doc
          .resolve(from - 1)
          .marks()
          .some((m) => m.type.name === "link")
      ) {
        from--;
      }

      // Walk forward
      while (
        to < resolved.end() &&
        doc
          .resolve(to)
          .marks()
          .some((m) => m.type.name === "link")
      ) {
        to++;
      }

      return { from, to };
    })();

    const text = editor.state.doc.textBetween(markRange.from, markRange.to, "");

    onEdit(href, text, markRange.from, markRange.to);
    setPopup(null);
    currentAnchor.current = null;
  }, [editor, onEdit]);

  if (!popup) return null;

  // Don't show hover popup if the editor selection is inside a link
  // (the BubbleMenu will handle that case)
  if (editor.isActive("link") && !editor.state.selection.empty) return null;

  return (
    <div
      ref={popupRef}
      className="fixed z-[9999] flex items-center gap-1 rounded-lg border border-border bg-surface px-2 py-1 shadow-lg"
      style={{
        left: popup.x,
        top: popup.y,
        transform: "translateX(-50%)",
      }}
      onMouseEnter={handlePopupEnter}
      onMouseLeave={handlePopupLeave}
    >
      <span
        className="max-w-[200px] truncate text-xs text-muted-foreground"
        title={popup.href}
      >
        {popup.href}
      </span>

      <div className="mx-1 h-4 w-[1px] bg-border" />

      <Button
        variant="ghost"
        size="sm"
        className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
        onClick={handleOpen}
        title="Open link"
      >
        <ExternalLink className="h-3.5 w-3.5" />
      </Button>

      {onEdit && (
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 text-muted-foreground hover:text-blue-600"
          onClick={handleEdit}
          title="Edit link"
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
      )}

      <Button
        variant="ghost"
        size="sm"
        className="h-6 w-6 p-0 text-muted-foreground hover:text-red-600"
        onClick={handleRemove}
        title="Remove link"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
};

export default LinkHoverPopup;
