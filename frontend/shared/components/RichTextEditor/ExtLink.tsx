import Link from "@tiptap/extension-link";

const ExtLink = Link.extend({
  renderHTML({ HTMLAttributes }) {
    return [
      "a",
      {
        ...HTMLAttributes,
        class: "text-lg text-[#0077ff] underline",
      },
      0,
    ];
  },
});

export default ExtLink;
