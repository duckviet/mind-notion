import { Plugin, PluginKey } from "@tiptap/pm/state";
import { NOTE_LAYOUT_VALUES, type NoteLayout } from "./layouts";

export const NoteLayoutPluginKey = new PluginKey<NoteLayout>("noteLayout");

const LAYOUT_CLASS_PREFIX = "mn-layout-";
const NOTE_LAYOUT_CLASSES = NOTE_LAYOUT_VALUES.filter(
  (layout) => layout !== "default",
).map((layout) => `${LAYOUT_CLASS_PREFIX}${layout}`);

function clearLayoutClasses(element: HTMLElement): void {
  for (const className of NOTE_LAYOUT_CLASSES) {
    element.classList.remove(className);
  }
}

export function createNoteLayoutPlugin(initialLayout: NoteLayout): Plugin {
  return new Plugin({
    key: NoteLayoutPluginKey,

    state: {
      init: () => initialLayout,
      apply(tr, currentLayout) {
        const next = tr.getMeta(NoteLayoutPluginKey) as NoteLayout | undefined;
        return next ?? currentLayout;
      },
    },

    view(editorView) {
      // Track the last applied layout to skip unnecessary DOM mutations.
      let lastAppliedLayout: NoteLayout | null = null;

      const applyClass = (layout: NoteLayout) => {
        if (layout === lastAppliedLayout) return; // nothing changed — skip DOM touch
        lastAppliedLayout = layout;

        const el = editorView.dom as HTMLElement;
        clearLayoutClasses(el);
        if (layout !== "default") {
          el.classList.add(`${LAYOUT_CLASS_PREFIX}${layout}`);
        }
      };

      // Apply immediately on init
      applyClass(initialLayout);

      return {
        update(view) {
          const layout = NoteLayoutPluginKey.getState(view.state);
          if (layout) applyClass(layout);
        },
        destroy() {
          const el = editorView.dom as HTMLElement;
          clearLayoutClasses(el);
        },
      };
    },
  });
}
