import { Globe, FileText, Wrench, Loader2, Check, AlertCircle } from "lucide-react";
import type { ChatMessageItem } from "./types";

const TOOL_LABELS: Record<
  string,
  { running: string; done: string; error: string }
> = {
  "web.search": {
    running: "Searching the web...",
    done: "Searched the web",
    error: "Failed to search the web",
  },
  "notes.write": {
    running: "Updating note...",
    done: "Note updated",
    error: "Failed to update note",
  },
  "notes.read": {
    running: "Reading note...",
    done: "Read note",
    error: "Failed to read note",
  },
  "notes.list": {
    running: "Listing notes...",
    done: "Listed notes",
    error: "Failed to list notes",
  },
};

function getToolIcon(toolName?: string) {
  if (toolName === "web.search") return Globe;
  if (toolName?.startsWith("notes.")) return FileText;
  return Wrench;
}

function getStatusText(toolName: string | undefined, status: ChatMessageItem["toolStatus"]): string {
  const labels = toolName ? TOOL_LABELS[toolName] : null;
  const displayName = toolName ?? "tool";

  if (labels) {
    if (status === "running") return labels.running;
    if (status === "done") return labels.done;
    if (status === "error") return labels.error;
  }

  if (status === "running") return `Using tool: ${displayName}...`;
  if (status === "done") return `Used tool: ${displayName}`;
  if (status === "error") return `Tool failed: ${displayName}`;
  return displayName;
}

interface ToolCallBubbleProps {
  id: string;
  toolName?: string;
  toolStatus?: ChatMessageItem["toolStatus"];
}

export function ToolCallBubble({ id, toolName, toolStatus }: ToolCallBubbleProps) {
  const isRunning = toolStatus === "running";
  const isDone = toolStatus === "done";
  const isError = toolStatus === "error";

  const Icon = getToolIcon(toolName);
  const statusText = getStatusText(toolName, toolStatus);

  return (
    <div className="flex justify-start my-2">
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-surface-100/50 text-text-muted">
        {isRunning && <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-500" />}
        {isDone && <Check className="w-3.5 h-3.5 text-emerald-500" />}
        {isError && <AlertCircle className="w-3.5 h-3.5 text-destructive" />}
        <Icon className="w-3.5 h-3.5 text-text-muted/80" />
        <span className="select-none">{statusText}</span>
      </div>
    </div>
  );
}
