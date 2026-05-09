// extensions/ExtAutoResize/index.ts
import { Editor, Extension } from "@tiptap/core";
import { prepare, layout } from "@chenglou/pretext";
import type { PreparedText } from "@chenglou/pretext";

export interface AutoResizeOptions {
  /** CSS font string, phải khớp với font thực của editor */
  font: string;
  /** Line height tính bằng px, phải khớp với CSS */
  lineHeight: number;
  /** Padding top + bottom của editor (px) */
  paddingY: number;
  /** Số dòng tối thiểu */
  minLines: number;
  /** Số dòng tối đa, undefined = không giới hạn */
  maxLines?: number;
  /** CSS selector của element cần set height, mặc định là ProseMirror root */
  targetSelector?: string;
}

const DEFAULT_OPTIONS: AutoResizeOptions = {
  font: "16px Inter",
  lineHeight: 24,
  paddingY: 32,
  minLines: 1,
};

function applyHeight(
  editor: Editor,
  storage: { cache: Map<string, PreparedText>; currentWidth: number },
  options: AutoResizeOptions,
) {
  const { font, lineHeight, paddingY, minLines, maxLines } = options;
  const { doc } = editor.state;
  const dom = editor.view.dom as HTMLElement;
  const width = storage.currentWidth || dom.clientWidth;
  if (width === 0) return;

  let totalLines = 0;
  doc.forEach((node) => {
    const text = node.textContent;
    if (!storage.cache.has(text)) {
      storage.cache.set(text, prepare(text, font, { whiteSpace: "pre-wrap" }));
    }
    const { lineCount } = layout(storage.cache.get(text)!, width, lineHeight);
    totalLines += Math.max(1, lineCount);
  });

  const clamped = Math.max(
    minLines,
    maxLines ? Math.min(totalLines, maxLines) : totalLines,
  );
  dom.style.height = `${clamped * lineHeight + paddingY}px`;
}

const ExtAutoResize = Extension.create<AutoResizeOptions>({
  name: "autoResize",
  addOptions() {
    return DEFAULT_OPTIONS;
  },
  addStorage() {
    return { cache: new Map(), resizeObserver: null, currentWidth: 0 };
  },
  onCreate() {
    const dom = this.editor.view.dom as HTMLElement;
    this.storage.currentWidth = dom.clientWidth;
    this.storage.resizeObserver = new ResizeObserver(([entry]) => {
      this.storage.currentWidth = entry.contentRect.width;
      applyHeight(this.editor, this.storage, this.options);
    });
    this.storage.resizeObserver.observe(dom);
    document.fonts.ready.then(() =>
      applyHeight(this.editor, this.storage, this.options),
    );
  },
  onUpdate() {
    applyHeight(this.editor, this.storage, this.options);
  },
  onDestroy() {
    this.storage.resizeObserver?.disconnect();
    this.storage.cache.clear();
  },
});

export default ExtAutoResize;
