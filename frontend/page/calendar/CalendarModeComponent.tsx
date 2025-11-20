"use client";

import { useCallback, useState, type RefObject } from "react";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";
import DayDialog from "./DayDialog";
import { CalendarDay, CalendarMode, DAYS, HolidayCode } from "./CalendarPage";

function CalendarModeComponent({
  mode,
  title,
  days,
  isLoading,
  todayRefDate,
  todayRefEl,
  highlightDate,
  onSetHoliday,
}: {
  mode?: CalendarMode;
  title?: string;
  days: CalendarDay[];
  isLoading?: boolean;
  todayRefDate?: string;
  todayRefEl?: RefObject<HTMLDivElement | null>;
  highlightDate?: string | null;
  onSetHoliday?: (date: string, holiday: HolidayCode) => void;
}) {
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null);

  const handleOpenDialog = useCallback((day: CalendarDay) => {
    setSelectedDay(day);
    setOpenDialog(true);
  }, []);

  const handleCloseDialog = useCallback(() => {
    setOpenDialog(false);
    setTimeout(() => setSelectedDay(null), 0);
  }, []);

  return (
    <div className="p-4 space-y-3 rounded-md h-full  ">
      {mode !== "weekly" && (
        <h4 className="text-md font-medium text-lg capitalize">
          {title && title.toLowerCase()}
          <span className="text-sm text-gray-500"> ({days.length} days)</span>
        </h4>
      )}
      <div className="grid grid-cols-7 gap-2">
        {DAYS.map((day) => (
          <div key={day} className="font-medium text-sm text-center">
            <p>{day}</p>
          </div>
        ))}
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-2">
          <Loader2 className="w-4 h-4 animate-spin" />
        </div>
      )}

      <div
        className="grid grid-cols-7 gap-2 h-full"
        style={{
          gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
          gap: "0.5rem",
        }}
      >
        {mode !== "weekly" &&
        days &&
        days.length > 0 &&
        typeof days[0]?.dayNumber === "number" &&
        days[0].dayNumber > 0 ? (
          <div
            style={{
              gridColumn: `span ${days[0].dayNumber} / span ${days[0].dayNumber}`,
            }}
          />
        ) : null}

        {days.map((day, index) => (
          <div
            key={`${day.date}-${index}`}
            ref={
              todayRefDate && todayRefDate === day.date && todayRefEl
                ? todayRefEl
                : undefined
            }
            className={cn(
              "p-2 h-30 bg-white rounded-md relative flex items-center cursor-pointer transition hover:bg-gray-100",
              highlightDate && highlightDate === day.date
                ? "bg-yellow-100 border-yellow-300 shadow-md ring ring-yellow-200 animate-pulse"
                : ""
            )}
            onClick={() => handleOpenDialog(day)}
          >
            <div className="text-sm text-gray-600 mr-2 left-3 top-3 absolute">
              {mode === "weekly" ? day.date : day.date.split("/")[0]}
            </div>
            <div className="h-6 w-full">
              {day.holiday === "H" && (
                <div className="px-3 mx-auto bg-red-50 shadow-sm border border-gray-300 text-center font-medium rounded-md text-gray-600">
                  {mode === "yearly" ? "Hol." : "Holiday"}
                </div>
              )}
            </div>
          </div>
        ))}

        <DayDialog
          open={openDialog}
          day={selectedDay}
          mode={mode}
          onClose={handleCloseDialog}
          onSetHoliday={onSetHoliday}
        />
      </div>
    </div>
  );
}
export default CalendarModeComponent;
