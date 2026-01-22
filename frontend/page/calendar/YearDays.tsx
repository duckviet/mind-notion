import { useMemo } from "react";
import dayjs, { Dayjs } from "dayjs";
import { useState } from "react";
import { useRef } from "react";
import { useEffect } from "react";
import { Button } from "@/shared/components/ui/button";
import { ArrowLeftIcon } from "lucide-react";
import { ArrowRightIcon } from "lucide-react";
import { CalendarMode, MONTHS } from "./CalendarPage";
import { ICalendar } from "./CalendarPage";
import { HolidayCode } from "./CalendarPage";
import { CalendarDay } from "./CalendarPage";
import CalendarModeComponent from "./CalendarModeComponent";
import WeeklyMode from "./WeeklyMode";
import { cn } from "@/lib/utils";
function YearDays({
  calendars,
  currentYear,
  setCurrentYear,
  onSetHoliday,
  isLoading,
}: {
  calendars?: ICalendar[];
  currentYear: number;
  setCurrentYear: (y: number) => void;
  onSetHoliday: (date: string, holiday: HolidayCode) => Promise<void> | void;
  isLoading?: boolean;
}) {
  const today = dayjs();
  const [currentMonth, setCurrentMonth] = useState(today.month());
  const [calendarMode, setCalendarMode] = useState<CalendarMode>("weekly");
  const [currentStartWeekDate, setCurrentStartWeekDate] = useState<Dayjs>(
    today.startOf("week").add(1, "day"),
  );

  const todayRef = useRef<HTMLDivElement>(null);
  const todayRefDate = today.format("DD/MM/YYYY");
  const [highlightedDate, setHighlightedDate] = useState<string | null>(null);

  const startDate = dayjs().year(currentYear).startOf("year");
  const endOfYear = dayjs().year(currentYear).endOf("year");
  const totalDays = endOfYear.diff(startDate, "day") + 1;

  const allDays = useMemo(
    () => Array.from({ length: totalDays }, (_, i) => startDate.add(i, "day")),
    [startDate, totalDays],
  );

  const calendarByMonth = useMemo(() => {
    const map = new Map<number, string>();
    calendars?.forEach((calendar) => {
      map.set(calendar.month, calendar.holidayList);
    });
    return map;
  }, [calendars]);

  const daysData = useMemo(() => {
    const grouped: Record<string, CalendarDay[]> = {};

    allDays.forEach((day) => {
      const monthKey = day.format("MMMM").toLowerCase();
      const monthNumber = day.month() + 1;
      const holidayList = calendarByMonth.get(monthNumber)?.split("") ?? [];
      if (!grouped[monthKey]) {
        grouped[monthKey] = [];
      }
      grouped[monthKey].push({
        date: day.format("DD/MM/YYYY"),
        dayName: day.format("dddd"),
        dayNumber: day.day() === 0 ? 6 : day.day() - 1,
        holiday: (holidayList[day.date() - 1] as HolidayCode) ?? "W",
      });
    });

    return MONTHS.map(
      (month) => [month, grouped[month] ?? []] as [string, CalendarDay[]],
    );
  }, [allDays, calendarByMonth]);

  const handleNextButton = () => {
    if (calendarMode === "yearly") {
      setCurrentYear(currentYear + 1);
    } else if (calendarMode === "monthly") {
      if (currentMonth === 11) {
        setCurrentYear(currentYear + 1);
        setCurrentMonth(0);
      } else {
        setCurrentMonth(currentMonth + 1);
      }
    } else if (calendarMode === "weekly") {
      setCurrentStartWeekDate((prev) => prev.add(1, "week"));
    }
  };

  const handlePrevButton = () => {
    if (calendarMode === "yearly") {
      setCurrentYear(currentYear - 1);
    } else if (calendarMode === "monthly") {
      if (currentMonth === 0) {
        setCurrentYear(currentYear - 1);
        setCurrentMonth(11);
      } else {
        setCurrentMonth(currentMonth - 1);
      }
    } else if (calendarMode === "weekly") {
      setCurrentStartWeekDate((prev) => prev.subtract(1, "week"));
    }
  };

  const handleTodayClick = () => {
    if (calendarMode === "yearly") {
      setCurrentYear(today.year());
    }
    if (calendarMode === "monthly") {
      setCurrentMonth(today.month());
    }
    if (calendarMode === "weekly") {
      setCurrentStartWeekDate(today.startOf("week").add(1, "day"));
    }

    setTimeout(() => {
      if (todayRef.current) {
        todayRef.current.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
        setHighlightedDate(todayRefDate);
      }
    }, 0);
  };

  const fullFillDays = (startDay: Dayjs, endDay: Dayjs) => {
    const numDays = endDay.diff(startDay, "day");
    if (numDays < 0) return [];
    return Array.from({ length: numDays + 1 }, (_, i) =>
      startDay.add(i, "day"),
    );
  };

  const startDay = currentStartWeekDate;
  const endDay = currentStartWeekDate.endOf("week").add(1, "day");
  const weekRange =
    calendarMode === "weekly" ? fullFillDays(startDay, endDay) : [];

  const weeklyDaysData =
    calendarMode !== "weekly"
      ? []
      : weekRange.map((day) => {
          const monthNumber = day.month() + 1;
          const holidayList = calendarByMonth.get(monthNumber)?.split("") ?? [];
          return {
            date: day.format("DD/MM/YYYY"),
            dayName: day.format("dddd"),
            dayNumber: day.day() === 0 ? 6 : day.day() - 1,
            holiday: (holidayList[day.date() - 1] as HolidayCode) ?? "W",
          };
        });

  useEffect(() => {
    if (highlightedDate) {
      const timeout = setTimeout(() => setHighlightedDate(null), 1800);
      return () => clearTimeout(timeout);
    }
  }, [highlightedDate]);

  const monthlyDays =
    daysData[currentMonth] && Array.isArray(daysData[currentMonth][1])
      ? (daysData[currentMonth][1] as CalendarDay[])
      : [];

  return (
    <div className="space-y-4 rounded-md p-4 h-full min-h-screen flex flex-col items-center">
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-2">
          <Button
            className="bg-surface cursor-pointer hover:bg-accent-100 text-primary"
            onClick={handlePrevButton}
          >
            <ArrowLeftIcon className="w-4 h-4" />
          </Button>
          <Button
            className="bg-surface cursor-pointer hover:bg-accent-100 text-primary"
            onClick={handleNextButton}
          >
            <ArrowRightIcon className="w-4 h-4" />
          </Button>
          <Button
            className="bg-surface cursor-pointer hover:bg-accent-100 text-primary"
            onClick={handleTodayClick}
          >
            Today
          </Button>
        </div>

        <h3 className="text-center font-bold text-4xl text-primary">
          {calendarMode === "monthly" && `${MONTHS[currentMonth]}, `}
          {calendarMode === "weekly" && weekRange.length
            ? `${weekRange[0].format("DD/MM")} - ${weekRange[weekRange.length - 1].format("DD/MM")}, `
            : null}
          {currentYear}
        </h3>

        <div className="flex items-center gap-2 justify-end">
          <Button
            onClick={() => setCalendarMode("yearly")}
            className={cn(
              "bg-surface cursor-pointer hover:bg-hover-overlay text-primary",
              calendarMode === "yearly" ? "bg-accent-500/20 " : "bg-surface",
            )}
          >
            Yearly
          </Button>
          <Button
            onClick={() => setCalendarMode("monthly")}
            className={cn(
              "bg-surface cursor-pointer hover:bg-hover-overlay text-primary",
              calendarMode === "monthly" ? "bg-accent-500/20 " : "bg-surface",
            )}
          >
            Monthly
          </Button>
          <Button
            onClick={() => setCalendarMode("weekly")}
            className={cn(
              "bg-surface cursor-pointer hover:bg-hover-overlay text-primary",
              calendarMode === "weekly" ? "bg-accent-500/20 " : "bg-surface",
            )}
          >
            Weekly
          </Button>
        </div>
      </div>

      <div className="h-full flex-1 w-full">
        {calendarMode === "yearly" && (
          <div className="grid grid-cols-2 gap-2">
            {daysData.map(([month, days]) => (
              <CalendarModeComponent
                key={month}
                mode="yearly"
                title={month}
                days={days}
                todayRefDate={todayRefDate}
                todayRefEl={todayRef}
                highlightDate={highlightedDate}
                onSetHoliday={onSetHoliday}
                isLoading={isLoading}
              />
            ))}
          </div>
        )}

        {calendarMode === "monthly" && (
          <CalendarModeComponent
            mode="monthly"
            title={MONTHS[currentMonth]}
            days={monthlyDays}
            todayRefDate={todayRefDate}
            todayRefEl={todayRef}
            highlightDate={highlightedDate}
            onSetHoliday={onSetHoliday}
            isLoading={isLoading}
          />
        )}

        {calendarMode === "weekly" && <WeeklyMode />}
      </div>
    </div>
  );
}

export default YearDays;
