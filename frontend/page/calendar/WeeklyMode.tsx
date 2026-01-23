import React, { useCallback, useMemo, useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

import {
  MultiZoneDndProvider,
  DroppableZone,
  SortableContext,
  SortableItem,
  arrayMove,
  type DragEndEvent,
  type UniqueIdentifier,
} from "@/shared/components/dnd";
import { DAYS } from "./CalendarPage";
import TaskCard from "./TaskCard";
import {
  useEventsRange,
  useCreateEvent,
  useUpdateEvent,
} from "@/features/event/api";
import { EventDialog } from "@/features/event/components";
import type { ResDetailEvent } from "@/features/event/types";
import type { ReqCreateEvent, ReqUpdateEvent } from "@/features/event/api";
import { Button } from "@/shared/components/ui/button";

type DayName = (typeof DAYS)[number];

export type DayTask = ResDetailEvent;

// Get the start and end of current week for API query
const getWeekRange = () => {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  return {
    start_time: monday.toISOString(),
    end_time: sunday.toISOString(),
  };
};

const DayMode = () => {
  const queryClient = useQueryClient();
  const weekRange = useMemo(() => getWeekRange(), []);
  const eventsQuery = useEventsRange(weekRange);
  const { data: eventsData, isLoading, queryKey } = eventsQuery;
  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const [selectedEvent, setSelectedEvent] = useState<
    ResDetailEvent | undefined
  >(undefined);

  // Current time state for the indicator line
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  // Convert API events to day-grouped structure
  const initialColumns = useMemo(() => {
    if (!eventsData?.data) {
      return {
        monday: [],
        tuesday: [],
        wednesday: [],
        thursday: [],
        friday: [],
        saturday: [],
        sunday: [],
      } as Record<DayName, DayTask[]>;
    }

    const grouped: Record<DayName, DayTask[]> = {
      monday: [],
      tuesday: [],
      wednesday: [],
      thursday: [],
      friday: [],
      saturday: [],
      sunday: [],
    };

    eventsData.data.forEach((event) => {
      const startDate = new Date(event.start_time);
      const dayIndex = startDate.getDay();
      const dayMap = [
        "sunday",
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
      ];
      const dayName = dayMap[dayIndex] as DayName;
      grouped[dayName].push(event);
    });

    return grouped;
  }, [eventsData]);

  const [columns, setColumns] =
    useState<Record<DayName, DayTask[]>>(initialColumns);

  // Update columns when API data changes
  useEffect(() => {
    setColumns(initialColumns);
  }, [initialColumns]);

  const openCreate = () => {
    setSelectedEvent(undefined);
    setDialogMode("create");
    setDialogOpen(true);
  };

  const openEdit = (event: ResDetailEvent) => {
    setSelectedEvent(event);
    setDialogMode("edit");
    setDialogOpen(true);
  };

  const handleSubmit = async (payload: ReqCreateEvent | ReqUpdateEvent) => {
    if (dialogMode === "create") {
      await createEvent.mutateAsync(payload as ReqCreateEvent);
    } else if (selectedEvent?.id) {
      await updateEvent.mutateAsync({
        id: selectedEvent.id,
        data: payload,
      });
    }
    if (queryKey) {
      await queryClient.invalidateQueries({ queryKey });
    } else {
      await queryClient.invalidateQueries({ queryKey: ["/events/range"] });
    }
    setDialogOpen(false);
  };

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over) {
        return;
      }

      const activeId = active.id.toString();
      const overId = over.id.toString();

      const findDayByTaskId = (
        taskId: string,
        columns: Record<DayName, DayTask[]>,
      ): DayName | undefined =>
        (DAYS as readonly DayName[]).find((day) =>
          columns[day].some((task) => task.id.toString() === taskId),
        );

      const getZoneId = (day: DayName) => `day-zone-${day}`;

      const sourceDay = findDayByTaskId(activeId, columns);
      if (!sourceDay) {
        return;
      }

      const sourceTasks = columns[sourceDay];
      const fromIndex = sourceTasks.findIndex(
        (task) => task.id.toString() === activeId,
      );
      if (fromIndex === -1) {
        return;
      }

      const zoneTarget = (DAYS as readonly DayName[]).find(
        (day) => getZoneId(day) === overId,
      );

      const destinationDay =
        zoneTarget ?? findDayByTaskId(overId, columns) ?? sourceDay;

      const targetTasks = columns[destinationDay];

      let destinationIndex = zoneTarget
        ? targetTasks.length
        : targetTasks.findIndex((task) => task.id.toString() === overId);

      if (destinationIndex < 0) {
        destinationIndex = targetTasks.length;
      }

      if (destinationDay === sourceDay && destinationIndex === fromIndex) {
        return;
      }

      const movedTask = sourceTasks[fromIndex];

      // Optimistic update
      if (destinationDay === sourceDay) {
        setColumns((prev) => ({
          ...prev,
          [sourceDay]: arrayMove(prev[sourceDay], fromIndex, destinationIndex),
        }));
      } else {
        const nextSource = [...sourceTasks];
        nextSource.splice(fromIndex, 1);

        const nextTarget = [...targetTasks];
        const insertIndex = Math.min(destinationIndex, nextTarget.length);
        nextTarget.splice(insertIndex, 0, movedTask);

        setColumns((prev) => ({
          ...prev,
          [sourceDay]: nextSource,
          [destinationDay]: nextTarget,
        }));

        // Calculate new start_time and end_time based on destination day
        const dayIndexMap: Record<DayName, number> = {
          sunday: 0,
          monday: 1,
          tuesday: 2,
          wednesday: 3,
          thursday: 4,
          friday: 5,
          saturday: 6,
        };

        const originalStartTime = new Date(movedTask.start_time);
        const originalEndTime = movedTask.end_time
          ? new Date(movedTask.end_time)
          : null;

        // Get the current week's date for the destination day
        const weekStart = new Date(weekRange.start_time);
        const weekStartDay = weekStart.getDay();
        const mondayOffset = weekStartDay === 0 ? -6 : 1 - weekStartDay;
        const monday = new Date(weekStart);
        monday.setDate(weekStart.getDate() + mondayOffset);

        // Calculate the target date
        const destDayIndex = dayIndexMap[destinationDay];
        const targetDate = new Date(monday);
        targetDate.setDate(monday.getDate() + destDayIndex - 1);

        // Preserve the time of day, but change the date
        const newStartTime = new Date(targetDate);
        newStartTime.setHours(
          originalStartTime.getHours(),
          originalStartTime.getMinutes(),
          originalStartTime.getSeconds(),
          originalStartTime.getMilliseconds(),
        );

        const newEndTime = originalEndTime ? new Date(targetDate) : undefined;
        if (newEndTime && originalEndTime) {
          newEndTime.setHours(
            originalEndTime.getHours(),
            originalEndTime.getMinutes(),
            originalEndTime.getSeconds(),
            originalEndTime.getMilliseconds(),
          );
        }

        // Persist to backend
        try {
          await updateEvent.mutateAsync({
            id: movedTask.id,
            data: {
              start_time: newStartTime.toISOString(),
              end_time: newEndTime?.toISOString(),
            },
          });
        } catch (error) {
          console.error("Failed to update event time:", error);
          // Revert on error
          setColumns((prev) => ({
            ...prev,
            [sourceDay]: sourceTasks,
            [destinationDay]: targetTasks,
          }));
        }
      }
    },
    [columns, weekRange.start_time, updateEvent],
  );

  const getTaskById = useCallback(
    (id: UniqueIdentifier | null) => {
      if (!id) return null;
      const taskId = id.toString();
      const findDayByTaskId = (
        taskId: string,
        columns: Record<DayName, DayTask[]>,
      ): DayName | undefined =>
        (DAYS as readonly DayName[]).find((day) =>
          columns[day].some((task) => task.id.toString() === taskId),
        );
      const day = findDayByTaskId(taskId, columns);
      if (!day) return null;
      return columns[day].find((task) => task.id.toString() === taskId) ?? null;
    },
    [columns],
  );

  const renderOverlay = useCallback(
    (activeId: UniqueIdentifier | null) => {
      const task = getTaskById(activeId);
      if (!task) return null;
      return <TaskCard task={task} />;
    },
    [getTaskById],
  );

  const getZoneId = (day: DayName) => `day-zone-${day}`;

  const TIME_IN_DAYS = Array.from({ length: 24 }, (_, i) => {
    const hour = i.toString().padStart(2, "0");
    return `${hour}:00`;
  });

  const HOUR_HEIGHT = 80; // pixels per hour - increased for better visibility
  const MIN_EVENT_HEIGHT = 30; // minimum height for events in pixels

  // Helper function to calculate event position and height
  const calculateEventPosition = (event: DayTask) => {
    const startTime = new Date(event.start_time);
    const endTime = event.end_time ? new Date(event.end_time) : null;

    // Calculate top position (hours from midnight * pixels per hour)
    const startHour = startTime.getHours();
    const startMinutes = startTime.getMinutes();
    const top = (startHour + startMinutes / 60) * HOUR_HEIGHT;

    // Calculate height (duration in hours * pixels per hour)
    let height = MIN_EVENT_HEIGHT;
    if (endTime) {
      const endHour = endTime.getHours();
      const endMinutes = endTime.getMinutes();
      const durationHours =
        endHour + endMinutes / 60 - (startHour + startMinutes / 60);
      height = Math.max(durationHours * HOUR_HEIGHT, MIN_EVENT_HEIGHT);
    }

    return { top, height };
  };

  // Helper function to detect overlapping events and calculate layout
  const calculateEventLayout = (tasks: DayTask[]) => {
    // Sort events by start time
    const sorted = [...tasks].sort((a, b) => {
      return (
        new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
      );
    });

    // Calculate positions and detect overlaps
    type EventLayout = {
      task: DayTask;
      top: number;
      height: number;
      startTime: number;
      endTime: number;
    };

    const layout: EventLayout[] = sorted.map((task) => {
      const position = calculateEventPosition(task);
      return {
        task,
        ...position,
        startTime: new Date(task.start_time).getTime(),
        endTime: task.end_time
          ? new Date(task.end_time).getTime()
          : new Date(task.start_time).getTime() + 60 * 60 * 1000, // Default 1 hour
      };
    });

    // Group overlapping events
    const columns: EventLayout[][] = [];
    layout.forEach((event) => {
      // Find a column where this event doesn't overlap with any existing event
      let placed = false;
      for (const column of columns) {
        const hasOverlap = column.some(
          (existingEvent) =>
            event.startTime < existingEvent.endTime &&
            event.endTime > existingEvent.startTime,
        );
        if (!hasOverlap) {
          column.push(event);
          placed = true;
          break;
        }
      }
      // If no suitable column found, create a new one
      if (!placed) {
        columns.push([event]);
      }
    });

    // Calculate width and offset for each event
    const eventLayouts = new Map<
      string,
      EventLayout & { columnIndex: number; totalColumns: number }
    >();
    columns.forEach((column, columnIndex) => {
      column.forEach((event) => {
        eventLayouts.set(event.task.id, {
          ...event,
          columnIndex,
          totalColumns: columns.length,
        });
      });
    });

    return eventLayouts;
  };

  if (isLoading) {
    return (
      <div className="space-y-6 p-4">
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading events...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header with Create button */}
      <div className="flex-shrink-0  py-4   border-b border-border flex items-center justify-between">
        <h2 className="text-lg font-semibold text-text-primary">Weekly</h2>
        <Button onClick={openCreate}>Create Event</Button>
      </div>

      <MultiZoneDndProvider
        onDragEnd={handleDragEnd}
        renderOverlay={renderOverlay}
      >
        <div className="flex flex-1 overflow-hidden border-t border-border bg-accent rounded-lg">
          {/* Time column */}
          <div className="flex-shrink-0 w-20   border-r border-border">
            <div className="h-16 border-b border-border" />{" "}
            {/* Spacer for day headers */}
            <div
              className="relative"
              style={{ height: `${HOUR_HEIGHT * 24}px` }}
            >
              {TIME_IN_DAYS.map((time, idx) => (
                <div
                  key={time}
                  className="absolute text-xs text-text-secondary text-right pr-3 w-full"
                  style={{ top: `${idx * HOUR_HEIGHT - 8}px` }}
                >
                  {time}
                </div>
              ))}
            </div>
          </div>

          {/* Calendar grid */}
          <div className="flex-1 overflow-auto  ">
            {/* Day headers */}
            <div className="sticky top-0 z-30   border-b border-border grid grid-cols-7">
              {DAYS.map((day) => (
                <div
                  key={day}
                  className="h-16 flex items-center justify-center font-semibold text-sm capitalize border-l first:border-l-0 border-border"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Time grid with events */}
            <div
              className="relative grid grid-cols-7"
              style={{ height: `${HOUR_HEIGHT * 24}px` }}
            >
              {/* Hour grid lines */}
              {TIME_IN_DAYS.map((time, idx) => (
                <div
                  key={`grid-${time}`}
                  className="col-span-7 border-t border-border absolute w-full pointer-events-none"
                  style={{ top: `${idx * HOUR_HEIGHT}px` }}
                />
              ))}

              {/* Current time indicator */}
              {(() => {
                const hours = currentTime.getHours();
                const minutes = currentTime.getMinutes();
                const position = (hours + minutes / 60) * HOUR_HEIGHT;
                return (
                  <div
                    className="col-span-7 absolute w-full z-20 pointer-events-none"
                    style={{ top: `${position}px` }}
                  >
                    <div className="relative">
                      <div className="absolute -left-1 w-3 h-3 -mt-1.5 bg-destructive rounded-full border-2 border-surface" />
                      <div className="border-t-2 border-destructive" />
                    </div>
                  </div>
                );
              })()}

              {/* Day columns with events */}
              {(DAYS as readonly DayName[]).map((day, dayIdx) => {
                const tasks = columns[day];
                const eventLayouts = calculateEventLayout(tasks);
                return (
                  <div
                    key={day}
                    className="relative border-l first:border-l-0 border-border"
                    style={{ height: `${HOUR_HEIGHT * 24}px` }}
                  >
                    <SortableContext
                      items={tasks.map((task) => task.id.toString())}
                    >
                      <DroppableZone
                        id={getZoneId(day)}
                        className="absolute inset-0"
                        activeClassName="bg-accent/10"
                      >
                        {/* Positioned events */}
                        {tasks.map((task) => {
                          const layout = eventLayouts.get(task.id);
                          if (!layout) return null;

                          const { top, height, columnIndex, totalColumns } =
                            layout;
                          const width =
                            totalColumns > 1 ? 100 / totalColumns : 100;
                          const left = columnIndex * width;

                          return (
                            <div
                              key={task.id}
                              className="absolute z-10"
                              style={{
                                top: `${top}px`,
                                height: `${height}px`,
                                left: `${left}%`,
                                width: `${width}%`,
                                padding: "0 2px",
                              }}
                            >
                              <SortableItem
                                id={task.id.toString()}
                                style={{ height: "100%" }}
                              >
                                <TaskCard
                                  task={task}
                                  onClick={() => openEdit(task)}
                                  compact={height < 60}
                                />
                              </SortableItem>
                            </div>
                          );
                        })}
                      </DroppableZone>
                    </SortableContext>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </MultiZoneDndProvider>

      <EventDialog
        mode={dialogMode}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initialEvent={selectedEvent}
        onSubmit={handleSubmit}
        submitting={createEvent.isPending || updateEvent.isPending}
      />
    </div>
  );
};

export default DayMode;
