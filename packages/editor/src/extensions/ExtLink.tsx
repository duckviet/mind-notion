import Link from "@tiptap/extension-link";

const ExtLink = Link.extend({
  renderHTML({ HTMLAttributes }) {
    return [
      "a",
      {
        ...HTMLAttributes,
        class:
          "break-words text-brand-600 underline-offset-2 hover:underline",
      },
      0,
    ];
  },
});

export default ExtLink;
