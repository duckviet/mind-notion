"use client";

import { useCallback, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";

import YearDays from "./YearDays";

dayjs.extend(customParseFormat);

export const MONTHS = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
] as const;

export const DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

export type HolidayCode = "H" | "W";

export interface ICalendar {
  year: number;
  month: number;
  holidayList: string;
}

export type CalendarMode = "yearly" | "monthly" | "weekly";

export interface CalendarDay {
  date: string;
  dayName: string;
  dayNumber: number;
  holiday: HolidayCode;
}

const fakeDelay = (ms = 250) =>
  new Promise((resolve) => setTimeout(resolve, ms));

const fakeCalendarStore = new Map<number, ICalendar[]>();

const ensureCalendarYear = (year: number) => {
  if (!fakeCalendarStore.has(year)) {
    const months = Array.from({ length: 12 }, (_, index) => {
      const month = index + 1;
      const baseDate = dayjs(`${year}-${String(month).padStart(2, "0")}-01`);
      const daysInMonth = baseDate.daysInMonth();
      const holidayList = Array.from({ length: daysInMonth }, (_, dayIndex) => {
        const date = baseDate.date(dayIndex + 1);
        return date.day() === 0 || date.day() === 6 ? "H" : "W";
      }).join("");
      return { year, month, holidayList };
    });
    fakeCalendarStore.set(year, months);
  }
  return fakeCalendarStore.get(year)!;
};

const cloneCalendarYear = (year: number) =>
  ensureCalendarYear(year).map((calendar) => ({ ...calendar }));

const fakeCalendarApi = {
  async list(year: number) {
    await fakeDelay();
    return cloneCalendarYear(year);
  },
  async update(year: number, month: number, payload: { holidayList: string }) {
    await fakeDelay(180);
    const current = ensureCalendarYear(year).map((calendar) =>
      calendar.month === month
        ? { ...calendar, holidayList: payload.holidayList }
        : calendar
    );
    fakeCalendarStore.set(year, current);
    return current.find((item) => item.month === month)!;
  },
};

export default function CalendarPage() {
  const queryClient = useQueryClient();
  const [currentYear, setCurrentYear] = useState<number>(dayjs().year());

  const { data: calendars = [], isLoading } = useQuery<ICalendar[]>({
    queryKey: ["calendar-manager", currentYear],
    queryFn: () => fakeCalendarApi.list(currentYear),
  });

  const handleSetHoliday = useCallback(
    async (date: string, holiday: HolidayCode) => {
      const [dayStr, monthStr, yearStr] = date.split("/");
      const year = Number(yearStr);
      const month = Number(monthStr);
      const day = Number(dayStr);

      const calendarForMonth = calendars.find(
        (item) => item.month === month && item.year === year
      );

      if (!calendarForMonth) {
        toast.error("Failed to update day");
        return;
      }

      const holidayChars = calendarForMonth.holidayList.split("");
      holidayChars[day - 1] = holiday;
      const payload = { holidayList: holidayChars.join("") };

      try {
        await fakeCalendarApi.update(year, month, payload);
        queryClient.setQueryData<ICalendar[]>(
          ["calendar-manager", year],
          (old) =>
            (old ?? []).map((item) =>
              item.month === month && item.year === year
                ? { ...item, holidayList: payload.holidayList }
                : item
            )
        );
        toast.success("Holiday updated");
      } catch (error) {
        console.error(error);
        toast.error("Failed to update day");
      }
    },
    [calendars, queryClient]
  );

  return (
    <div className="hidden md:flex h-full flex-1 flex-col space-y-6 p-6 px-12">
      <YearDays
        calendars={calendars}
        currentYear={currentYear}
        setCurrentYear={setCurrentYear}
        onSetHoliday={handleSetHoliday}
        isLoading={isLoading}
      />
    </div>
  );
}
