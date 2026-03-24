// ─── Small helpers (same file or separate) ───────────────

import { cn } from "@/lib/utils";
import { Button } from "../ui/button";

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
    <Button
      variant="ghost"
      size="sm"
      className={cn("h-6 w-6 p-0 text-muted-foreground")}
      onClick={onClick}
      title={title}
    >
      <Icon className="h-3.5 w-3.5" />
    </Button>
  );
}
