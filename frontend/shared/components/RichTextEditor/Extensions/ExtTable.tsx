import {
  Table,
  TableRow,
  TableCell,
  TableHeader,
} from "@tiptap/extension-table";

// 1. Tùy chỉnh Table Cell để hỗ trợ border và padding đẹp hơn
export const ExtTableCell = TableCell.extend({
  renderHTML({ HTMLAttributes }) {
    return [
      "td",
      {
        ...HTMLAttributes,
        class:
          "border border-gray-300 p-2 min-w-[100px] relative group vertical-align-top",
      },
      0,
    ];
  },
});

// 2. Tùy chỉnh Table Header (th)
export const ExtTableHeader = TableHeader.extend({
  renderHTML({ HTMLAttributes }) {
    return [
      "th",
      {
        ...HTMLAttributes,
        class:
          "border border-red-300 p-2 font-bold text-left min-w-[100px] relative group",
      },
      0,
    ];
  },
});

export const ExtTable = Table.configure({
  resizable: true,
  lastColumnResizable: true,
  allowTableNodeSelection: true,
}).extend({
  renderHTML({ HTMLAttributes }) {
    const wrapperAttrs = {
      class: "table-wrapper my-6 overflow-x-auto rounded-lg group relative",
      "data-type": "table-container",
    };

    const tableAttrs = {
      ...HTMLAttributes,
      class: "w-full table-auto border-collapse",
    };

    return ["div", wrapperAttrs, ["table", tableAttrs, ["tbody", 0]]];
  },
});

export const ExtTableRow = TableRow.extend({
  renderHTML({ HTMLAttributes }) {
    return ["tr", { ...HTMLAttributes, class: "border-b border-gray-300" }, 0];
  },
});

// const addRow = () => editor.chain().focus().addRowAfter().run();
// const addCol = () => editor.chain().focus().addColumnAfter().run();
// const deleteTable = () => editor.chain().focus().deleteTable().run();
// const mergeCells = () => editor.chain().focus().mergeCells().run();

const ExtTableKit = [ExtTable, ExtTableRow, ExtTableCell, ExtTableHeader];

export default ExtTableKit;
