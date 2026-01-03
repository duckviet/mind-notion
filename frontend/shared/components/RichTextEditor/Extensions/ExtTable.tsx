import {
  Table,
  TableRow,
  TableCell,
  TableHeader,
} from "@tiptap/extension-table";

// Bộ mở rộng Table được tuỳ biến giao diện bằng Tailwind CSS
const ExtTable = Table.extend({
  renderHTML({
    HTMLAttributes,
  }: {
    HTMLAttributes: React.HTMLAttributes<HTMLTableElement>;
  }) {
    return [
      "table",
      {
        ...HTMLAttributes,
        class:
          "min-w-full border border-gray-300 rounded-lg my-4 overflow-hidden",
      },
      ["tbody", 0],
    ];
  },
});

const ExtTableRow = TableRow.extend({
  renderHTML({
    HTMLAttributes,
  }: {
    HTMLAttributes: React.HTMLAttributes<HTMLTableRowElement>;
  }) {
    return [
      "tr",
      {
        ...HTMLAttributes,
        class: "border-b last:border-0",
      },
      0,
    ];
  },
});

const ExtTableCell = TableCell.extend({
  renderHTML({
    HTMLAttributes,
  }: {
    HTMLAttributes: React.HTMLAttributes<HTMLTableCellElement>;
  }) {
    return [
      "td",
      {
        ...HTMLAttributes,
        class: "px-4 py-2 border border-gray-200 align-top",
      },
      0,
    ];
  },
});

const ExtTableHeader = TableHeader.extend({
  renderHTML({
    HTMLAttributes,
  }: {
    HTMLAttributes: React.HTMLAttributes<HTMLTableSectionElement>;
  }) {
    return [
      "thead",
      {
        ...HTMLAttributes,
        class: "bg-gray-50",
      },
      0,
    ];
  },
});

const ExtTableKit = [ExtTable, ExtTableRow, ExtTableCell, ExtTableHeader];

export default ExtTableKit;
