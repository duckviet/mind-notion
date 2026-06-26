import type {
  ReqCreateEvent,
  ReqUpdateEvent,
  ResDetailEvent,
} from "@/features/event";

import type { DAYS } from "./calendarTypes";

export type DayName = (typeof DAYS)[number];

export type CreateEventResult =
  | ResDetailEvent
  | {
      readonly data: ResDetailEvent;
    };

type BuildMovedEventTimesInput = {
  readonly destinationDay: DayName;
  readonly isAllDay: boolean;
  readonly originalStartTime: string;
  readonly originalEndTime?: string;
  readonly weekStartTime: string;
};

type MovedEventTimes = {
  readonly start_time: string;
  readonly end_time?: string;
};

type BuildDraggedEventUpdateInput = {
  readonly task: ResDetailEvent;
  readonly destinationDay: DayName;
  readonly weekStartTime: string;
};

export type DraggedEventUpdate = ReqUpdateEvent & {
  readonly type: ResDetailEvent["type"];
};

const DAY_INDEX_BY_NAME: Record<DayName, number> = {
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
  sunday: 0,
};

export function getCreatedEventId(result: CreateEventResult): string {
  if ("id" in result) {
    return result.id;
  }

  return result.data.id;
}

export function isCreateEventPayload(
  payload: ReqCreateEvent | ReqUpdateEvent,
): payload is ReqCreateEvent {
  return (
    typeof payload.title === "string" &&
    "type" in payload &&
    typeof payload.type === "string" &&
    typeof payload.start_time === "string"
  );
}

export function buildMovedEventTimes({
  destinationDay,
  isAllDay,
  originalStartTime,
  originalEndTime,
  weekStartTime,
}: BuildMovedEventTimesInput): MovedEventTimes {
  const startTime = new Date(originalStartTime);
  const endTime = originalEndTime ? new Date(originalEndTime) : undefined;
  const weekStart = new Date(weekStartTime);
  const weekStartDay = weekStart.getDay();
  const mondayOffset = weekStartDay === 0 ? -6 : 1 - weekStartDay;
  const monday = new Date(weekStart);
  monday.setDate(weekStart.getDate() + mondayOffset);

  const targetDate = new Date(monday);
  const destinationDayIndex = DAY_INDEX_BY_NAME[destinationDay];
  const destinationOffset =
    destinationDayIndex === 0 ? 6 : destinationDayIndex - 1;
  targetDate.setDate(monday.getDate() + destinationOffset);

  const movedStartTime = new Date(targetDate);
  movedStartTime.setHours(
    startTime.getHours(),
    startTime.getMinutes(),
    startTime.getSeconds(),
    startTime.getMilliseconds(),
  );

  if (!endTime) {
    if (isAllDay) {
      const movedEndTime = new Date(movedStartTime);
      movedEndTime.setDate(movedStartTime.getDate() + 1);

      return {
        start_time: movedStartTime.toISOString(),
        end_time: movedEndTime.toISOString(),
      };
    }

    return { start_time: movedStartTime.toISOString() };
  }

  const durationMs = endTime.getTime() - startTime.getTime();
  const movedEndTime = new Date(movedStartTime.getTime() + durationMs);

  return {
    start_time: movedStartTime.toISOString(),
    end_time: movedEndTime.toISOString(),
  };
}

export function buildDraggedEventUpdate({
  task,
  destinationDay,
  weekStartTime,
}: BuildDraggedEventUpdateInput): DraggedEventUpdate {
  const movedTimes = buildMovedEventTimes({
    destinationDay,
    isAllDay: Boolean(task.is_all_day),
    originalStartTime: task.start_time,
    originalEndTime: task.end_time,
    weekStartTime,
  });

  return {
    title: task.title,
    description: task.description,
    tags: task.tags,
    type: task.type,
    ...movedTimes,
    due_date: task.due_date,
    status: task.status,
    priority: task.priority,
    category_id: task.category_id,
    is_all_day: task.is_all_day,
  };
}

type ShouldPushGoogleAfterDragInput = {
  readonly googleCalendarConnected: boolean;
  readonly googleEventId?: string | null;
  readonly source?: string;
};

export function shouldPushGoogleAfterDrag({
  googleCalendarConnected,
  googleEventId,
  source,
}: ShouldPushGoogleAfterDragInput): boolean {
  return (
    googleCalendarConnected && (source === "google" || Boolean(googleEventId))
  );
}
