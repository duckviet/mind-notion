import { CodeBlock } from "@tiptap/extension-code-block";

const ExtCodeBlock = CodeBlock.extend({
  renderHTML({ HTMLAttributes }) {
    return [
      "pre",
      {
        ...HTMLAttributes,
        class: "bg-gray-900 text-white rounded-md px-4 py-2 overflow-x-auto",
      },
      ["code", 0],
    ];
  },
});

export default ExtCodeBlock;
