import React, { useCallback, useMemo, useState } from "react";

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

type DayName = (typeof DAYS)[number];

export interface DayTask {
  id: string;
  title: string;
  description?: string;
  time?: string;
  category: "meeting" | "focus" | "reminder" | "personal";
}

const WEEK_TEMPLATE: Record<DayName, DayTask[]> = {
  monday: [
    {
      id: "mon-standup",
      title: "Team stand-up",
      description: "Sync with product & design",
      time: "09:00",
      category: "meeting",
    },
    {
      id: "mon-review",
      title: "Review sprint board",
      description: "Finalize priorities for the week",
      time: "11:00",
      category: "focus",
    },
  ],
  tuesday: [
    {
      id: "tue-research",
      title: "Research prototype",
      description: "Explore drag-n-drop calendar",
      time: "10:00",
      category: "focus",
    },
    {
      id: "tue-coaching",
      title: "Coaching session",
      description: "Mentor catch-up",
      time: "15:30",
      category: "personal",
    },
  ],
  wednesday: [
    {
      id: "wed-demo",
      title: "Feature demo",
      description: "Show calendar flow",
      time: "14:00",
      category: "meeting",
    },
  ],
  thursday: [
    {
      id: "thu-retro",
      title: "Weekly retro",
      description: "Team retrospective",
      time: "16:00",
      category: "meeting",
    },
  ],
  friday: [
    {
      id: "fri-focus",
      title: "Focus block",
      description: "Ship DayMode UI",
      time: "09:30",
      category: "focus",
    },
    {
      id: "fri-coffee",
      title: "Coffee chat",
      description: "Catch-up with PM",
      time: "13:00",
      category: "personal",
    },
  ],
  saturday: [
    {
      id: "sat-gym",
      title: "Morning workout",
      description: "45 min cardio",
      time: "08:30",
      category: "personal",
    },
  ],
  sunday: [],
};

const buildInitialColumns = () =>
  Object.entries(WEEK_TEMPLATE).reduce(
    (acc, [day, tasks]) => ({
      ...acc,
      [day]: tasks.map((task) => ({ ...task })),
    }),
    {} as Record<DayName, DayTask[]>
  );

const getZoneId = (day: DayName) => `day-zone-${day}`;

const findDayByTaskId = (
  taskId: string,
  columns: Record<DayName, DayTask[]>
): DayName | undefined =>
  (DAYS as readonly DayName[]).find((day) =>
    columns[day].some((task) => task.id === taskId)
  );

const DayMode = () => {
  const [columns, setColumns] =
    useState<Record<DayName, DayTask[]>>(buildInitialColumns);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) {
      return;
    }

    const activeId = active.id.toString();
    const overId = over.id.toString();

    setColumns((prev) => {
      const sourceDay = findDayByTaskId(activeId, prev);
      if (!sourceDay) {
        return prev;
      }

      const sourceTasks = prev[sourceDay];
      const fromIndex = sourceTasks.findIndex((task) => task.id === activeId);
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
        : targetTasks.findIndex((task) => task.id === overId);

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
      const day = findDayByTaskId(taskId, columns);
      if (!day) return null;
      return columns[day].find((task) => task.id === taskId) ?? null;
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
  return (
    <div className="space-y-6 p-4">
      <MultiZoneDndProvider
        onDragEnd={handleDragEnd}
        renderOverlay={renderOverlay}
      >
        {" "}
        <div className="flex h-full">
          <div className="flex flex-col gap-32 mt-8 h-full">
            {TIME_IN_DAYS.map((time) => (
              <div key={time} className="text-sm text-center h-16">
                <p>{time}</p>
              </div>
            ))}
          </div>
          <div className="h-full">
            <div className="grid grid-cols-7 gap-2">
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
                    <SortableContext items={tasks.map((task) => task.id)}>
                      <DroppableZone
                        id={getZoneId(day)}
                        className="flex h-full flex-col gap-3 rounded-md  p-3 transition-all"
                        activeClassName="border-sky-500 bg-gray-50"
                      >
                        {tasks.length === 0 && (
                          <div className="rounded-md border border-dashed border-muted-foreground/40 bg-muted/20 p-3 text-center text-xs text-muted-foreground">
                            Drop tasks here
                          </div>
                        )}
                        {tasks.map((task) => (
                          <SortableItem key={task.id} id={task.id}>
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
