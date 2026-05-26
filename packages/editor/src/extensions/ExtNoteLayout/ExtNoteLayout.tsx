import { Extension } from "@tiptap/core";
import type { NoteLayout } from "./layouts";
import {
  createNoteLayoutPlugin,
  NoteLayoutPluginKey,
} from "./NoteLayoutPlugin";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    noteLayout: {
      setLayout: (layout: NoteLayout) => ReturnType;
    };
  }
}

export interface NoteLayoutOptions {
  initialLayout: NoteLayout;
  onLayoutChange?: (layout: NoteLayout) => void;
}

export const ExtNoteLayout = Extension.create<NoteLayoutOptions>({
  name: "noteLayout",

  addOptions() {
    return {
      initialLayout: "default",
      onLayoutChange: undefined,
    };
  },

  addCommands() {
    return {
      setLayout:
        (layout: NoteLayout) =>
        ({ tr, dispatch }) => {
          if (dispatch) {
            tr.setMeta(NoteLayoutPluginKey, layout);
            dispatch(tr);
            this.options.onLayoutChange?.(layout);
          }
          return true;
        },
    };
  },

  addProseMirrorPlugins() {
    return [createNoteLayoutPlugin(this.options.initialLayout)];
  },
});
