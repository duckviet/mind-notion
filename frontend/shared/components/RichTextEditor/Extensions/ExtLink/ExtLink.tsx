// extensions/ext-link.ts
import Link from "@tiptap/extension-link";

const ExtLink = Link.extend({
  renderHTML({ HTMLAttributes }) {
    return [
      "a",
      {
        ...HTMLAttributes,
        class:
          " text-blue-400 underline-offset-2 hover:underline hover:text-blue-600 break-words",
      },
      0,
    ];
  },
});

export default ExtLink;
