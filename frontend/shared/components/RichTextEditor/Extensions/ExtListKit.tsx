import {
  BulletList,
  OrderedList,
  ListItem,
  TaskList,
} from "@tiptap/extension-list";

const ExtBulletList = BulletList.extend({
  renderHTML({ HTMLAttributes }) {
    return [
      "ul",
      {
        ...HTMLAttributes,
        class: "list-disc pl-6 my-2",
      },
      0,
    ];
  },
});

const ExtOrderedList = OrderedList.extend({
  renderHTML({ HTMLAttributes }) {
    return [
      "ol",
      {
        ...HTMLAttributes,
        class: "list-decimal pl-6 my-2",
      },
      0,
    ];
  },
});

const ExtListItem = ListItem.extend({
  renderHTML({ HTMLAttributes }) {
    return [
      "li",
      {
        ...HTMLAttributes,
        class: "mb-1",
      },
      0,
    ];
  },
});

const ExtListKit = [ExtBulletList, ExtOrderedList, ExtListItem];

export default ExtListKit;
