import React from "react";
import { Button } from "@/shared/components/ui/button";
import { useGoogleCalendarStatus, useGoogleCalendarConnect, useGoogleCalendarDisconnect, useGoogleCalendarSync } from "../api";
import { CalendarIcon, Loader2, RefreshCw, LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";

export const GoogleCalendarToolbar = () => {
  const { data: status, isLoading } = useGoogleCalendarStatus();
  const { connect, isConnecting } = useGoogleCalendarConnect();
  const disconnectMutation = useGoogleCalendarDisconnect();
  const syncMutation = useGoogleCalendarSync();

  if (isLoading) {
    return (
      <Button variant="outline" size="sm" disabled>
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        Checking Sync...
      </Button>
    );
  }

  if (!status?.connected) {
    return (
      <Button variant="outline" size="sm" onClick={() => connect()} disabled={isConnecting} className="gap-2">
        {isConnecting ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <CalendarIcon className="w-4 h-4" />
        )}
        Connect Google Calendar
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => syncMutation.mutate()}
        disabled={syncMutation.isPending}
        className="gap-2"
      >
        <RefreshCw className={`w-4 h-4 ${syncMutation.isPending ? "animate-spin" : ""}`} />
        Sync Google Events
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <CalendarIcon className="h-4 w-4 text-primary" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem 
            onClick={() => disconnectMutation.mutate()}
            disabled={disconnectMutation.isPending}
            className="text-destructive focus:text-destructive cursor-pointer"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Disconnect
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
