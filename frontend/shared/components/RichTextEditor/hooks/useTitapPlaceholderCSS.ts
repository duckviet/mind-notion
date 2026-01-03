import { useEffect } from "react";

export function useTiptapPlaceholderCSS() {
  useEffect(() => {
    const css = `
      .tiptap p.is-editor-empty:first-child::before {
        color: #adb5bd;
        content: attr(data-placeholder);
        float: left;
        height: 0;
        pointer-events: none;
      }
    `;
    const styleTag = document.createElement("style");
    styleTag.setAttribute("data-tiptap-custom-placeholder", "true");
    styleTag.innerHTML = css;
    document.head.appendChild(styleTag);
    return () => {
      document.head.removeChild(styleTag);
    };
  }, []);
}
