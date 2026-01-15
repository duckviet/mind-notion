import BlockQuote from "@tiptap/extension-blockquote";

const ExtBlockQuote = BlockQuote.extend({
  renderHTML() {
    return [
      "blockquote",
      { class: "border-l-4 border-gray-300 pl-4 italic my-4" },
      0,
    ];
  },
});

export default ExtBlockQuote;
