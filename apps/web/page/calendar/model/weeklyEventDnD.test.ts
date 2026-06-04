import { describe, expect, it } from "vitest";

import { buildDraggedEventUpdate } from "./googleSync";
import type { DayTask } from "./weeklyTypes";

const baseTask: DayTask = {
  id: "event-1",
  user_id: 1,
  title: "Planning",
  type: "event",
  start_time: "2026-06-02T09:30:00.000Z",
  end_time: "2026-06-02T10:45:00.000Z",
  status: "pending",
  priority: "normal",
  is_all_day: false,
  created_at: "2026-06-01T00:00:00.000Z",
  updated_at: "2026-06-01T00:00:00.000Z",
};

describe("buildDraggedEventUpdate", () => {
  it("moves a timed event to the target weekday while preserving time, duration, and editable fields", () => {
    const result = buildDraggedEventUpdate({
      task: baseTask,
      destinationDay: "friday",
      weekStartTime: "2026-06-01T00:00:00.000Z",
    });

    expect(result.start_time).toBe("2026-06-05T09:30:00.000Z");
    expect(result.end_time).toBe("2026-06-05T10:45:00.000Z");
    expect(result.title).toBe("Planning");
    expect(result.status).toBe("pending");
    expect(result.priority).toBe("normal");
    expect(result.is_all_day).toBe(false);
  });

  it("keeps all-day events on an exclusive next-day end when no end exists", () => {
    const result = buildDraggedEventUpdate({
      task: {
        ...baseTask,
        is_all_day: true,
        start_time: "2026-06-02T00:00:00.000Z",
        end_time: undefined,
      },
      destinationDay: "sunday",
      weekStartTime: "2026-06-01T00:00:00.000Z",
    });

    expect(result.start_time).toBe("2026-06-07T00:00:00.000Z");
    expect(result.end_time).toBe("2026-06-08T00:00:00.000Z");
    expect(result.is_all_day).toBe(true);
  });

  it("preserves the exclusive end date for dragged Google all-day events", () => {
    const result = buildDraggedEventUpdate({
      task: {
        ...baseTask,
        google_event_id: "google-event-1",
        source: "google",
        is_all_day: true,
        start_time: "2026-06-02T00:00:00.000Z",
        end_time: "2026-06-03T00:00:00.000Z",
      },
      destinationDay: "friday",
      weekStartTime: "2026-06-01T00:00:00.000Z",
    });

    expect(result.start_time).toBe("2026-06-05T00:00:00.000Z");
    expect(result.end_time).toBe("2026-06-06T00:00:00.000Z");
    expect(result.is_all_day).toBe(true);
  });
});
