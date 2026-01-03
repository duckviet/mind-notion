import { useEffect } from "react";

export function useTiptapPlaceholderCSS() {
  useEffect(() => {
    const css = `
      /* Placeholder */
      .tiptap p.is-editor-empty:first-child::before {
        color: #adb5bd;
        content: attr(data-placeholder);
        float: left;
        height: 0;
        pointer-events: none;
      }

      /* Table layout */
      .tiptap.ProseMirror table {
        margin: 1rem 0;
        border-collapse: collapse;
        width: 100%;
      }

      .tiptap.ProseMirror table td,
      .tiptap.ProseMirror table th {
        min-width: 1em;
        position: relative;
      }

      /* Resize handle */
      .tiptap.ProseMirror table .column-resize-handle {
        position: absolute;
        right: -2px;
        top: 0;
        bottom: -2px;
        width: 4px;
        background-color: #3b82f6;
        pointer-events: none;
      }

      /* Multi-cell selection */
      .tiptap.ProseMirror table .selectedCell:after {
        z-index: 2;
        content: "";
        position: absolute;
        left: 0;
        right: 0;
        top: 0;
        bottom: 0;
        background: rgba(200, 200, 255, 0.4);
        pointer-events: none;
      }
    `;

    const existing = document.querySelector(
      'style[data-tiptap-custom-placeholder="true"]'
    );
    if (existing) return;

    const styleTag = document.createElement("style");
    styleTag.setAttribute("data-tiptap-custom-placeholder", "true");
    styleTag.textContent = css;
    document.head.appendChild(styleTag);

    return () => {
      document.head.removeChild(styleTag);
    };
  }, []);
}
