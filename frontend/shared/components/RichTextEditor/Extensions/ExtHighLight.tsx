import HighLight from "@tiptap/extension-highlight";

const ExtHighLight = HighLight.extend({
  renderHTML() {
    return ["mark", { class: "bg-yellow-200 px-1 py-0.5 rounded-sm" }, 0];
  },
});

export default ExtHighLight;
