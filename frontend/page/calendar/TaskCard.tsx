import { cn } from "@/lib/utils";
import { DayTask } from "./DayMode";

const TaskCard = ({ task }: { task: DayTask }) => (
  <div className="rounded-lg bg-white p-3 text-left   transition hover:shadow-md">
    <p className="text-lg font-semibold">{task.title}</p>
    {task.description && (
      <p className="text-xs text-muted-foreground">{task.description}</p>
    )}

    <div className="my-2 flex items-center justify-between text-xs text-muted-foreground">
      <span
        className={cn(
          "rounded-lg border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
          {
            "border-sky-400 text-sky-600": task.category === "meeting",
            "border-emerald-400 text-emerald-600": task.category === "focus",
            "border-amber-400 text-amber-600": task.category === "reminder",
            "border-purple-400 text-purple-600": task.category === "personal",
          }
        )}
      >
        {task.category}
      </span>
    </div>

    <span className="text-xs text-muted-foreground">
      {task.time ?? "All day"} PM
    </span>
  </div>
);

export default TaskCard;
