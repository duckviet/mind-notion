import DOMPurify from "dompurify";

export const sanitizeHtml = (html: string) => {
  if (typeof window === "undefined") return html;
  return DOMPurify.sanitize(html, { USE_PROFILES: { html: true } });
};
