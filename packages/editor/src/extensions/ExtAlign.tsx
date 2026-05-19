import TextAlign from "@tiptap/extension-text-align";

export const ExtAlign = TextAlign.configure({
  types: ["heading", "paragraph"],
});

export default ExtAlign;
