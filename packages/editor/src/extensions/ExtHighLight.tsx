import HighLight from "@tiptap/extension-highlight";

const ExtHighLight = HighLight.extend({
  renderHTML() {
    return ["mark", { class: "rounded-sm bg-brand-100 px-0.5 py-0.5" }, 0];
  },
});

export default ExtHighLight;
