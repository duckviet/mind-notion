import { TaskItem, TaskList } from "@tiptap/extension-list";
import {
  ReactNodeViewRenderer,
  NodeViewWrapper,
  NodeViewContent,
} from "@tiptap/react";

const ExtTaskList = TaskList.extend({
  addAttributes() {
    return {
      class: {
        default: "not-prose list-none pl-0 my-3 space-y-2",
      },
    };
  },
});

const TaskItemComponent = ({
  node,
  updateAttributes,
  extension,
}: {
  node: any;
  updateAttributes: any;
  extension: any;
}) => {
  return (
    <NodeViewWrapper
      className={`group flex items-start gap-3 rounded-lg px-2 transition-colors hover:bg-muted/40 ${
        node.attrs.checked ? "bg-muted/20" : ""
      }`}
    >
      <div contentEditable={false} className="mt-0.5 flex items-center">
        <input
          type="checkbox"
          checked={node.attrs.checked}
          onChange={(e) => updateAttributes({ checked: e.target.checked })}
          className="h-4 w-4 rounded border-border text-primary accent-primary transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        />
      </div>

      <NodeViewContent
        className={`flex-1 leading-relaxed text-sm text-foreground/90 ${
          node.attrs.checked ? "line-through text-muted-foreground" : ""
        }`}
      />
    </NodeViewWrapper>
  );
};

// 3. Task Item Extension: Gắn React Component vào
const ExtTaskItem = TaskItem.extend({
  addNodeView() {
    return ReactNodeViewRenderer(TaskItemComponent);
  },
});

const ExtTaskListKit = [ExtTaskList, ExtTaskItem];

export default ExtTaskListKit;
