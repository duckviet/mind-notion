import DOMPurify from "dompurify";

export const sanitizeHtml = (html: string) => {
  if (typeof window === "undefined") return html;
  return DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
    ADD_ATTR: [
      "data-type",
      "data-drawing-id",
      "data-room-id",
      "data-drawing-snapshot",
      "data-preview-url",
      "data-width",
      "data-height",
      "data-updated-at",
      "data-snapshot-version",
    ],
  });
};
