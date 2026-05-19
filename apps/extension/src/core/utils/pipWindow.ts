export const PIP_WINDOW_WIDTH = 400;
export const PIP_WINDOW_HEIGHT = 520;

/**
 * Prepares the PiP document by injecting CSS text directly.
 *
 * WHY: In a Chrome extension, stylesheets bundled by Vite are injected as
 * <style> tags that are either inaccessible (CORS) or have no `.href` to
 * link to. Copying `document.styleSheets` silently fails. Instead, callers
 * import their CSS as a raw string (via `?inline`) and pass it here so it
 * gets injected as a single <style> block — guaranteed to work.
 *
 * @param pipWindow  The Picture-in-Picture window returned by requestWindow()
 * @param cssText    Raw CSS string to inject (import with `?inline` in Vite)
 */
export function preparePiPDocument(
  pipWindow: Window,
  cssText: string
): HTMLElement {
  const doc = pipWindow.document;

  // Reset body
  doc.body.style.cssText = "margin:0;padding:0;background:#fff;";

  // Inject styles
  if (cssText) {
    const style = doc.createElement("style");
    style.textContent = cssText;
    doc.head.appendChild(style);
  }

  // Mount root
  const root = doc.createElement("div");
  root.id = "pip-root";
  root.style.cssText = "width:100%;height:100%;overflow:auto;";
  doc.body.appendChild(root);

  return root;
}