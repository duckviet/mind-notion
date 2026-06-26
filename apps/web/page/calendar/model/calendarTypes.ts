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

