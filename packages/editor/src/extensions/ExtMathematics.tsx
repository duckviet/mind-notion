import Math, { migrateMathStrings } from "@tiptap/extension-mathematics";

const ExtMathematics = Math.extend({
  addOptions() {
    return {
      ...this.parent?.(),
      katexOptions: {
        throwOnError: false,
        errorColor: "var(--destructive)",
        strict: false,
        trust: false,
        macros: {
          "\\RR": "\\mathbb{R}",
          "\\NN": "\\mathbb{N}",
          "\\ZZ": "\\mathbb{Z}",
          "\\QQ": "\\mathbb{Q}",
          "\\CC": "\\mathbb{C}",
        },
      },
    };
  },

  addCommands() {
    return {
      setMath:
        (tex: string) =>
        ({ commands }: any) => {
          return commands.insertInlineMath({ latex: tex || " " });
        },
      setMathBlock:
        (tex: string) =>
        ({ commands }: any) => {
          return commands.insertBlockMath({ latex: tex || " " });
        },
      toggleMath:
        () =>
        ({ commands, state }: any) => {
          const { from, to } = state.selection;
          const text = state.doc.textBetween(from, to, " ");
          return commands.insertInlineMath({ latex: text || " " });
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      "Mod-m": () => {
        const { state } = this.editor;
        const { from, to } = state.selection;
        const text = state.doc.textBetween(from, to, " ");
        return this.editor.commands.insertInlineMath({ latex: text || " " });
      },
      "Mod-Shift-m": () => {
        const { state } = this.editor;
        const { from, to } = state.selection;
        const text = state.doc.textBetween(from, to, " ");
        return this.editor.commands.insertBlockMath({ latex: text || " " });
      },
    };
  },
});

export { migrateMathStrings };
export default ExtMathematics;

