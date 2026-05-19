export const PIP_WINDOW_WIDTH = 400;
export const PIP_WINDOW_HEIGHT = 520;

const FONT_STYLESHEET =
  "https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&display=swap";

export type PreparePiPDocumentOptions = {
  extraCss?: string;
};

function injectFontStylesheet(doc: Document): void {
  if (doc.querySelector(`link[href="${FONT_STYLESHEET}"]`)) return;

  const link = doc.createElement("link");
  link.rel = "stylesheet";
  link.href = FONT_STYLESHEET;
  doc.head.appendChild(link);
}

/**
 * Creates a clean PiP document. The PiP UI owns its styles and does not depend
 * on content-script CSS from the host page.
 */
export async function preparePiPDocument(
  pipWindow: Window,
  options: PreparePiPDocumentOptions = {},
): Promise<HTMLElement> {
  const { extraCss } = options;
  const doc = pipWindow.document;

  if (!doc.head) {
    doc.documentElement.insertBefore(doc.createElement("head"), doc.body);
  }

  injectFontStylesheet(doc);

  if (extraCss?.trim()) {
    const style = doc.createElement("style");
    style.setAttribute("data-mn", "pip-extra");
    style.textContent = extraCss;
    doc.head.appendChild(style);
  }

  doc.documentElement.style.cssText = "margin:0;padding:0;";
  doc.body.style.cssText =
    "margin:0;padding:0;background:#e9edf3;font-family:'DM Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;";

  const mount = doc.createElement("div");
  mount.id = "pip-root";
  mount.style.cssText = "width:100vw;height:100vh;overflow:hidden;";
  doc.body.appendChild(mount);

  return mount;
}
