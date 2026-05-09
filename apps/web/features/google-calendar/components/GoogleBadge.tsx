import React from "react";
import { CalendarDays } from "lucide-react";

export const GoogleBadge = () => {
  return (
    <div
      className="absolute top-1 right-1 bg-white/90 rounded-full p-0.5 shadow-sm"
      title="From Google Calendar"
    >
      <CalendarDays className="w-3 h-3 text-blue-500" />
    </div>
  );
};
