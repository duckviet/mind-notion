import { Image } from "@tiptap/extension-image";

const ExtImage = Image.extend({
  renderHTML({ node, HTMLAttributes }) {
    return [
      "img",
      {
        ...HTMLAttributes,
        src: node.attrs.src,
        alt: node.attrs.alt || "",
        title: node.attrs.title || "",
        class: "max-w-full rounded border border-gray-200 my-2 shadow",
        allowBase64: true,
      },
    ];
  },
});

export default ExtImage;
