import { Extension } from "@tiptap/core";

type ExtTableOfContentsStorage = {
  toc: boolean;
};

interface ExtTableOfContentsOptions {
  initialToc: boolean;
  onToggle?: (toc: boolean) => void;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    tableOfContents: {
      toggleTableOfContents: () => ReturnType;
    };
  }

  interface Storage {
    extTableOfContents: ExtTableOfContentsStorage;
  }
}

const ExtTableOfContents = Extension.create<
  ExtTableOfContentsOptions,
  ExtTableOfContentsStorage
>({
  name: "extTableOfContents",

  addOptions() {
    return {
      initialToc: false,
      onToggle: undefined,
    };
  },

  addStorage() {
    return {
      toc: this.options.initialToc,
    };
  },

  addCommands() {
    return {
      toggleTableOfContents:
        () =>
        ({ editor }) => {
          const newValue = !this.storage.toc;
          this.storage.toc = newValue;

          // Trigger re-render cho Tiptap
          editor.view.dispatch(editor.state.tr);

          // Gọi callback để sync với React State/LocalStorage
          if (this.options.onToggle) {
            this.options.onToggle(newValue);
          }
          return true;
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      "Mod-k": () => this.editor.commands.toggleTableOfContents(),
    };
  },
});

export default ExtTableOfContents;
