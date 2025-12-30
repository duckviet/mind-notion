"use client";

import React, {
  useMemo,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import { Editor } from "@tiptap/react";
import { cn } from "@/lib/utils";
import { ChevronRight, ChevronDown, MoreHorizontal } from "lucide-react";

interface Heading {
  id: string;
  level: number;
  text: string;
  pos: number;
  index: number;
}

interface HeadingNode {
  data: Heading;
  children: HeadingNode[];
  parentId?: string; // Thêm parent ID để track relationship
}

interface TableOfContentsProps {
  editor: Editor | null;
  className?: string;
  maxHeadingLevel?: number;
}

const buildHeadingTree = (headings: Heading[]): HeadingNode[] => {
  const tree: HeadingNode[] = [];
  const stack: { level: number; node: HeadingNode }[] = [];

  headings.forEach((heading) => {
    const node: HeadingNode = {
      data: heading,
      children: [],
      parentId:
        stack.length > 0 ? stack[stack.length - 1].node.data.id : undefined,
    };

    while (stack.length > 0 && stack[stack.length - 1].level >= heading.level) {
      stack.pop();
    }

    if (stack.length === 0) {
      tree.push(node);
    } else {
      stack[stack.length - 1].node.children.push(node);
    }

    stack.push({ level: heading.level, node });
  });

  return tree;
};

interface TOCItemProps {
  node: HeadingNode;
  activeId: string | null;
  onNodeClick: (heading: Heading) => void;
  onToggle: (id: string) => void;
  openItems: Set<string>;
}

const TOCItem = ({
  node,
  activeId,
  onNodeClick,
  onToggle,
  openItems,
}: TOCItemProps) => {
  const { data, children } = node;
  const hasChildren = children.length > 0;
  const isOpen = openItems.has(data.id);
  const isActive = activeId === data.id;

  return (
    <li className="list-none">
      <div
        className={cn(
          "group flex items-start py-1.5 pr-2 text-sm transition-all duration-200 rounded-md relative",
          "hover:bg-accent/50",
          isActive
            ? "text-foreground font-semibold bg-accent/80"
            : "text-muted-foreground"
        )}
        style={{
          paddingLeft: `${(data.level - 2) * 12}px`,
        }}
      >
        {hasChildren && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggle(data.id);
            }}
            className="mr-1 p-0.5 rounded hover:bg-muted-foreground/20 text-muted-foreground transition-colors flex-shrink-0"
          >
            {isOpen ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )}
          </button>
        )}
        {!hasChildren && <div className="w-[22px] flex-shrink-0" />}

        <button
          type="button"
          onClick={() => onNodeClick(data)}
          className="flex-1 text-left truncate leading-tight outline-none"
        >
          {data.text}
        </button>

        {isActive && (
          <div className="w-1.5 h-1.5 rounded-full bg-primary absolute right-2 top-1/2 -translate-y-1/2" />
        )}
      </div>

      {hasChildren && isOpen && (
        <ul className="animate-in slide-in-from-top-1 duration-200">
          {children.map((child) => (
            <TOCItem
              key={child.data.id}
              node={child}
              activeId={activeId}
              onNodeClick={onNodeClick}
              onToggle={onToggle}
              openItems={openItems}
            />
          ))}
        </ul>
      )}
    </li>
  );
};

export const TableOfContents = ({
  editor,
  className,
  maxHeadingLevel = 3,
}: TableOfContentsProps) => {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());
  const headingsRef = useRef<Heading[]>([]);
  const treeRef = useRef<HeadingNode[]>([]); // Cache tree để tránh tính lại

  const flatHeadings = useMemo(() => {
    if (!editor) return [];
    const headings: Heading[] = [];
    let index = 0;

    editor.state.doc.descendants((node, pos) => {
      if (node.type.name.match(/^heading/)) {
        const level = node?.attrs?.level || 0;
        if (level > maxHeadingLevel) return;

        headings.push({
          id: `heading-${pos}`,
          level,
          text: node.textContent || `Heading ${index + 1}`,
          pos,
          index,
        });
        index++;
      }
    });
    headingsRef.current = headings;
    return headings;
  }, [editor?.state, maxHeadingLevel]);

  const tree = useMemo(() => {
    const result = buildHeadingTree(flatHeadings);
    treeRef.current = result;
    return result;
  }, [flatHeadings]);

  // Hàm tìm tất cả ancestor IDs của một heading
  const getAncestorIds = useCallback(
    (targetId: string, treeData: HeadingNode[]): string[] => {
      const ancestors: string[] = [];

      const findInTree = (
        nodes: HeadingNode[],
        target: string
      ): HeadingNode | null => {
        for (const node of nodes) {
          if (node.data.id === target) return node;
          if (node.children.length > 0) {
            const found = findInTree(node.children, target);
            if (found) return found;
          }
        }
        return null;
      };

      const targetNode = findInTree(treeData, targetId);
      if (!targetNode) return ancestors;

      let current: HeadingNode | undefined = targetNode;
      while (current?.parentId) {
        ancestors.push(current.parentId);
        // Tìm parent node để tiếp tục lấy parent ID
        const findParent = (
          nodes: HeadingNode[],
          parentId: string
        ): HeadingNode | undefined => {
          for (const node of nodes) {
            if (node.data.id === parentId) return node;
            if (node.children.length > 0) {
              const found = findParent(node.children, parentId);
              if (found) return found;
            }
          }
          return undefined;
        };
        current = findParent(treeData, current.parentId);
      }

      return ancestors;
    },
    []
  );

  // Auto-expand cha khi active thay đổi
  useEffect(() => {
    if (!activeId) return;

    // Tìm tất cả ancestor IDs và expand chúng
    const ancestorIds = getAncestorIds(activeId, treeRef.current);

    setOpenItems((prev) => {
      const newSet = new Set(prev);
      ancestorIds.forEach((id) => newSet.add(id));
      return newSet;
    });
  }, [activeId, getAncestorIds]);

  useEffect(() => {
    if (!editor || flatHeadings.length === 0) return;

    const dom = editor.view.dom;
    const headingElements = Array.from(dom.querySelectorAll("h1, h2, h3"));

    const observerMap = new Map<Element, Heading>();
    flatHeadings.forEach((h) => {
      const el = headingElements[h.index];
      if (el) observerMap.set(el, h);
    });

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries.filter((entry) => entry.isIntersecting);

        if (visibleEntries.length > 0) {
          visibleEntries.sort(
            (a, b) => b.intersectionRatio - a.intersectionRatio
          );
          const element = visibleEntries[0].target;
          const heading = observerMap.get(element);
          if (heading && heading.id !== activeId) {
            setActiveId(heading.id);
          }
        }
      },
      {
        root: dom.parentElement || null,
        rootMargin: "-20% 0px -60% 0px",
        threshold: 0,
      }
    );

    headingElements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [editor, flatHeadings, activeId]);

  const handleHeadingClick = useCallback(
    (heading: Heading) => {
      if (!editor) return;

      editor
        .chain()
        .focus()
        .setTextSelection(heading.pos)
        .scrollIntoView()
        .run();

      setOpenItems((prev) => new Set(prev).add(heading.id));
    },
    [editor]
  );

  const handleToggle = useCallback((id: string) => {
    setOpenItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  if (flatHeadings.length === 0) return null;

  if (!editor?.storage.extTableOfContents.toc) return null;

  return (
    <div className="w-64 sticky top-10 h-fit bg-white shadow-md rounded-lg p-3">
      <div className={cn("flex flex-col h-full", className)}>
        <div className="p-2">
          <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            Contents
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto select-none">
          <ul className="space-y-1">
            {tree.map((node) => (
              <TOCItem
                key={node.data.id}
                node={node}
                activeId={activeId}
                onNodeClick={handleHeadingClick}
                onToggle={handleToggle}
                openItems={openItems}
              />
            ))}
          </ul>
        </nav>
      </div>{" "}
    </div>
  );
};

export default TableOfContents;
