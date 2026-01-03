import { Heading } from "@tiptap/extension-heading";

const ExtHeading = Heading.extend({
  renderHTML({ node, HTMLAttributes }) {
    // node.attrs.level: 1 -> h1, 2 -> h2, ...
    const level = node.attrs.level || 1;
    const Tag = `h${level}`;

    return [
      Tag,
      {
        ...HTMLAttributes,
        class: [
          // Áp dụng các class Tailwind cho từng loại heading
          level === 1 && "text-4xl font-bold my-4",
          level === 2 && "text-3xl font-semibold my-3",
          level === 3 && "text-2xl font-medium my-2",
          level === 4 && "text-xl font-medium my-2",
        ]
          .filter(Boolean)
          .join(" "),
      },
      0,
    ];
  },
});

export default ExtHeading;
