import React, { useCallback, useMemo, useState, useEffect } from "react";

import {
  MultiZoneDndProvider,
  DroppableZone,
  SortableContext,
  SortableItem,
  arrayMove,
  type DragEndEvent,
  type UniqueIdentifier,
} from "@/shared/components/dnd";
import { cn } from "@/lib/utils";
import { DAYS } from "./CalendarPage";
import TaskCard from "./TaskCard";
import { useEventsRange } from "@/features/event/api";
import type { ResDetailEvent } from "@/features/event/types";

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
  const weekRange = useMemo(() => getWeekRange(), []);
  const { data: eventsData, isLoading } = useEventsRange(weekRange);

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

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) {
      return;
    }

    const activeId = active.id.toString();
    const overId = over.id.toString();

    setColumns((prev) => {
      const findDayByTaskId = (
        taskId: string,
        columns: Record<DayName, DayTask[]>
      ): DayName | undefined =>
        (DAYS as readonly DayName[]).find((day) =>
          columns[day].some((task) => task.id.toString() === taskId)
        );

      const getZoneId = (day: DayName) => `day-zone-${day}`;

      const sourceDay = findDayByTaskId(activeId, prev);
      if (!sourceDay) {
        return prev;
      }

      const sourceTasks = prev[sourceDay];
      const fromIndex = sourceTasks.findIndex(
        (task) => task.id.toString() === activeId
      );
      if (fromIndex === -1) {
        return prev;
      }

      const zoneTarget = (DAYS as readonly DayName[]).find(
        (day) => getZoneId(day) === overId
      );

      const destinationDay =
        zoneTarget ?? findDayByTaskId(overId, prev) ?? sourceDay;

      const targetTasks = prev[destinationDay];

      let destinationIndex = zoneTarget
        ? targetTasks.length
        : targetTasks.findIndex((task) => task.id.toString() === overId);

      if (destinationIndex < 0) {
        destinationIndex = targetTasks.length;
      }

      if (destinationDay === sourceDay && destinationIndex === fromIndex) {
        return prev;
      }

      if (destinationDay === sourceDay) {
        return {
          ...prev,
          [sourceDay]: arrayMove(sourceTasks, fromIndex, destinationIndex),
        };
      }

      const movedTask = sourceTasks[fromIndex];
      const nextSource = [...sourceTasks];
      nextSource.splice(fromIndex, 1);

      const nextTarget = [...targetTasks];
      const insertIndex = Math.min(destinationIndex, nextTarget.length);
      nextTarget.splice(insertIndex, 0, movedTask);

      return {
        ...prev,
        [sourceDay]: nextSource,
        [destinationDay]: nextTarget,
      };
    });
  }, []);

  const getTaskById = useCallback(
    (id: UniqueIdentifier | null) => {
      if (!id) return null;
      const taskId = id.toString();
      const findDayByTaskId = (
        taskId: string,
        columns: Record<DayName, DayTask[]>
      ): DayName | undefined =>
        (DAYS as readonly DayName[]).find((day) =>
          columns[day].some((task) => task.id.toString() === taskId)
        );
      const day = findDayByTaskId(taskId, columns);
      if (!day) return null;
      return columns[day].find((task) => task.id.toString() === taskId) ?? null;
    },
    [columns]
  );

  const renderOverlay = useCallback(
    (activeId: UniqueIdentifier | null) => {
      const task = getTaskById(activeId);
      if (!task) return null;
      return <TaskCard task={task} />;
    },
    [getTaskById]
  );

  const getZoneId = (day: DayName) => `day-zone-${day}`;

  const TIME_IN_DAYS = [
    "09:00",
    "10:00",
    "11:00",
    "12:00",
    "13:00",
    "14:00",
    "15:00",
    "16:00",
    "17:00",
    "18:00",
    "19:00",
    "20:00",
    "21:00",
    "22:00",
    "23:00",
  ];

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
    <div className="space-y-6 p-4">
      <MultiZoneDndProvider
        onDragEnd={handleDragEnd}
        renderOverlay={renderOverlay}
      >
        {" "}
        <div className="flex h-full space-x-2">
          <div className="flex flex-col gap-2 mt-6 h-full">
            {TIME_IN_DAYS.map((time) => (
              <div key={time} className="text-sm text-center h-30 p-3">
                <p>{time}</p>
              </div>
            ))}
          </div>
          <div className="h-full">
            <div className="grid grid-cols-7">
              {DAYS.map((day) => (
                <div key={day} className="font-medium text-sm text-center">
                  <p>{day}</p>
                </div>
              ))}
            </div>
            <div
              className="grid "
              style={{ gridTemplateColumns: "repeat(7, minmax(150px, 1fr))" }}
            >
              {(DAYS as readonly DayName[]).map((day) => {
                const tasks = columns[day];
                return (
                  <div key={day} className="flex flex-col gap-4 h-full">
                    <SortableContext
                      items={tasks.map((task) => task.id.toString())}
                    >
                      <DroppableZone
                        id={getZoneId(day)}
                        className="flex h-full flex-col gap-4 rounded-md  p-3 transition-all"
                        activeClassName="border-sky-500 bg-gray-50"
                      >
                        {tasks.length === 0 && (
                          <div className="rounded-md border border-dashed border-muted-foreground/40 bg-muted/20 p-3 text-center text-xs text-muted-foreground">
                            Drop tasks here
                          </div>
                        )}
                        {tasks.map((task) => (
                          <SortableItem key={task.id} id={task.id.toString()}>
                            <TaskCard task={task} />
                          </SortableItem>
                        ))}
                      </DroppableZone>
                    </SortableContext>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </MultiZoneDndProvider>
    </div>
  );
};

export default DayMode;
