import BlockQuote from "@tiptap/extension-blockquote";

const ExtBlockQuote = BlockQuote.extend({
  renderHTML() {
    return [
      "blockquote",
      { class: "my-4 border-l-4 border-border pl-4 italic text-text-secondary" },
      0,
    ];
  },
});

export default ExtBlockQuote;
