import "katex/dist/katex.min.css";

import Math, { migrateMathStrings } from "@tiptap/extension-mathematics";

const ExtMathematics = Math.extend({
  addOptions() {
    return {
      katexOptions: {
        throwOnError: false,
        errorColor: "#cc0000",
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

  addAttributes() {
    return {
      class: {
        default: "math-inline",
        parseHTML: (element: HTMLElement) => element.getAttribute("class"),
        renderHTML: (attributes: any) => {
          if (!attributes.class) {
            return {};
          }
          return {
            class: attributes.class,
          };
        },
      },
    };
  },

  renderHTML({ HTMLAttributes, node }: any) {
    const isBlock = node.attrs.kind === "block";
    const tag = isBlock ? "div" : "span";
    const className = isBlock
      ? "math-block my-4 p-4 bg-gray-50 rounded-lg border border-gray-200 overflow-x-auto text-center"
      : "math-inline mx-1 px-2 py-1 bg-blue-50 rounded border border-blue-200";

    return [
      tag,
      {
        ...HTMLAttributes,
        class: className,
        "data-math": node.attrs.tex,
        "data-katex": "true",
      },
      0,
    ];
  },

  addCommands() {
    return {
      setMath:
        (tex: string) =>
        ({ commands }: any) => {
          return commands.insertContent({
            type: this.name,
            attrs: { tex },
          });
        },
      setMathBlock:
        (tex: string) =>
        ({ commands }: any) => {
          return commands.insertContent({
            type: this.name,
            attrs: { tex, kind: "block" },
          });
        },
      toggleMath:
        () =>
        ({ commands }: any) => {
          return commands.toggleMark(this.name);
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      "Mod-m": () => this.editor.commands.toggleMark(this.name),
      "Mod-Shift-m": () =>
        this.editor.commands.insertContent({
          type: this.name,
          attrs: { tex: "", kind: "block" },
        }),
    };
  },
});

// Optional: you could export migrateMathStrings as well if you want to use it in your setup
export { migrateMathStrings };
export default ExtMathematics;
