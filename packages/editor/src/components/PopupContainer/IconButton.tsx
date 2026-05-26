// ─── Small helpers (same file or separate) ───────────────

import { cn } from "../../utils/cn";

export function Divider() {
  return <div className="mx-1 h-4 w-[1px] bg-border" />;
}

export default function IconButton({
  icon: Icon,
  title,
  onClick,
  hoverColor = "hover:text-foreground",
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  onClick: () => void;
  hoverColor?: string;
}) {
  return (
    <button
      type="button"
      className={cn(
        "h-6 w-6 p-0 text-muted-foreground flex items-center justify-center rounded hover:bg-accent-foreground/10 transition-colors",
        hoverColor
      )}
      onClick={onClick}
      title={title}
    >
      <Icon className="h-3.5 w-3.5" />
    </button>
  );
}
