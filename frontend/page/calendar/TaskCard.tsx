import { cn } from "@/lib/utils";
import { DayTask } from "./WeeklyMode";

const TaskCard = ({
  task,
  onClick,
}: {
  task: DayTask;
  onClick?: () => void;
}) => {
  const start = task.start_time ? new Date(task.start_time) : null;
  const end = task.end_time ? new Date(task.end_time) : null;
  const timeLabel = task.is_all_day
    ? "All day"
    : start
      ? `${start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}${end ? ` - ${end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : ""}`
      : "";

  return (
    <div
      className="rounded-2xl cursor-pointer bg-white p-3 text-left transition hover:shadow-md"
      onClick={onClick}
    >
      <p className="text-lg font-semibold">{task.title}</p>
      {task.description && (
        <p className="text-xs text-muted-foreground">{task.description}</p>
      )}

      <div className="my-2 flex items-center justify-between text-xs text-muted-foreground">
        <span
          className={cn(
            "rounded-lg border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
            {
              "border-sky-400 text-sky-600": task.type === "event",
              "border-emerald-400 text-emerald-600": task.type === "task",
              "border-amber-400 text-amber-600": task.type === "note",
            }
          )}
        >
          {task.type}
        </span>
        <span className="text-xs capitalize">{task.priority}</span>
      </div>

      {timeLabel && (
        <span className="text-xs text-muted-foreground">{timeLabel}</span>
      )}
    </div>
  );
};

export default TaskCard;
