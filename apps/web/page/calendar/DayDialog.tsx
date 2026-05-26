/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import {
  useCallback,
  useMemo,
  useRef,
  useState,
  useEffect,
  type RefObject,
} from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import dayjs, { Dayjs } from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { ArrowLeftIcon, ArrowRightIcon, Loader2 } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { cn } from "@/lib/utils";
import { CalendarDay, CalendarMode, HolidayCode } from "./CalendarPage";

dayjs.extend(customParseFormat);
function DayDialog({
  open,
  day,
  onClose,
  onSetHoliday,
}: {
  open: boolean;
  day: CalendarDay | null;
  mode?: CalendarMode;
  onClose: () => void;
  onSetHoliday?: (date: string, holiday: HolidayCode) => void;
}) {
  const [value, setValue] = useState<HolidayCode>("W");

  useEffect(() => {
    setValue(day?.holiday ?? "W");
  }, [day]);

  const handleSave = async () => {
    if (!day || !onSetHoliday) return;
    await onSetHoliday(day.date, value);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{day ? day.date : "Day details"}</DialogTitle>
          <DialogDescription>
            {day
              ? `${day.dayName}${day.holiday === "H" ? ` · Holiday` : ""}`
              : "Select a day to edit."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <label
            className="text-sm font-medium text-gray-700"
            htmlFor="holiday-select"
          >
            Mark this day as
          </label>
          <select
            id="holiday-select"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            value={value}
            onChange={(event) => setValue(event.target.value as HolidayCode)}
          >
            <option value="W">Working day</option>
            <option value="H">Holiday</option>
          </select>
        </div>

        <DialogFooter className="pt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!day}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
export default DayDialog;
