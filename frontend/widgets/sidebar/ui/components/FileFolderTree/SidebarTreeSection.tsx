import { ChevronDown, ChevronRight, FolderTree } from "lucide-react";

type SidebarTreeSectionProps = {
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
};

export function SidebarTreeSection({
  isOpen,
  onToggle,
  children,
}: SidebarTreeSectionProps) {
  return (
    <div className="group-data-[collapsible=icon]:hidden">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between rounded-md px-2 py-2 text-xs font-semibold uppercase tracking-wide text-text-muted hover:bg-surface-100/50"
      >
        <div className="flex gap-3 items-center">
          <FolderTree className="size-4 text-text-muted ml-1" />
          <span>File / Folder</span>
        </div>
        {isOpen ? (
          <ChevronDown className="size-4" />
        ) : (
          <ChevronRight className="size-4" />
        )}
      </button>
      {isOpen ? <div className="mt-1">{children}</div> : null}
    </div>
  );
}
