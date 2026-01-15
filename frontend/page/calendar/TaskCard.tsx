import { cn } from "@/lib/utils";
import { DayTask } from "./WeeklyMode";

const TaskCard = ({
  task,
  onClick,
  compact = false,
}: {
  task: DayTask;
  onClick?: () => void;
  compact?: boolean;
}) => {
  const start = task.start_time ? new Date(task.start_time) : null;
  const end = task.end_time ? new Date(task.end_time) : null;
  const timeLabel = task.is_all_day
    ? "All day"
    : start
      ? `${start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}${end ? ` - ${end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : ""}`
      : "";

  // Compact mode for small event cards
  if (compact) {
    return (
      <div
        className={cn(
          "h-full rounded cursor-pointer px-2 py-1 text-left transition shadow-sm hover:shadow border-l-3 overflow-hidden",
          {
            "bg-sky-50 border-l-sky-500": task.type === "event",
            "bg-emerald-50 border-l-emerald-500": task.type === "task",
            "bg-amber-50 border-l-amber-500": task.type === "note",
          }
        )}
        onClick={onClick}
      >
        <p className="text-xs font-semibold truncate leading-tight">{task.title}</p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "h-full rounded cursor-pointer p-2 text-left transition shadow-sm hover:shadow-md border-l-3 overflow-hidden flex flex-col",
        {
          "bg-sky-50 border-l-sky-500": task.type === "event",
          "bg-emerald-50 border-l-emerald-500": task.type === "task",
          "bg-amber-50 border-l-amber-500": task.type === "note",
        }
      )}
      onClick={onClick}
    >
      <p className="text-sm font-semibold line-clamp-2 leading-tight mb-1">{task.title}</p>
      {task.description && (
        <p className="text-xs text-muted-foreground line-clamp-2 mb-1">
          {task.description}
        </p>
      )}

      {timeLabel && (
        <span className="text-xs text-muted-foreground mt-auto">
          {timeLabel}
        </span>
      )}
    </div>
  );
};

export default TaskCard;
