import { useEffect, useMemo, useState } from "react";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Switch } from "@/shared/components/ui/switch";
import type {
  ReqCreateEvent,
  ReqUpdateEvent,
  ResDetailEvent,
  ReqCreateEventType,
  ReqCreateEventStatus,
  ReqCreateEventPriority,
} from "@/shared/services/generated/api";

export type EventFormValues = {
  title: string;
  description?: string;
  type: ReqCreateEventType;
  start_time: string; // local datetime input value
  end_time?: string; // local datetime input value
  status?: ReqCreateEventStatus;
  priority?: ReqCreateEventPriority;
  is_all_day: boolean;
};

const toInputDateTime = (iso?: string) => {
  if (!iso) return "";
  const date = new Date(iso);
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
};

const toIsoString = (value?: string) => {
  if (!value) return undefined;
  return new Date(value).toISOString();
};

const defaultFormValues: EventFormValues = {
  title: "",
  description: "",
  type: "task",
  start_time: toInputDateTime(new Date().toISOString()),
  end_time: "",
  status: "pending",
  priority: "normal",
  is_all_day: false,
};

type EventDialogProps = {
  mode: "create" | "edit";
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialEvent?: ResDetailEvent;
  onSubmit: (payload: ReqCreateEvent | ReqUpdateEvent) => Promise<void> | void;
  submitting?: boolean;
};

export function EventDialog({
  mode,
  open,
  onOpenChange,
  initialEvent,
  onSubmit,
  submitting,
}: EventDialogProps) {
  const [formValues, setFormValues] =
    useState<EventFormValues>(defaultFormValues);

  useEffect(() => {
    if (!initialEvent) {
      setFormValues(defaultFormValues);
      return;
    }

    setFormValues({
      title: initialEvent.title || "",
      description: initialEvent.description || "",
      type: initialEvent.type as ReqCreateEventType,
      start_time: toInputDateTime(initialEvent.start_time),
      end_time: toInputDateTime(initialEvent.end_time),
      status: initialEvent.status as ReqCreateEventStatus,
      priority: initialEvent.priority as ReqCreateEventPriority,
      is_all_day: Boolean(initialEvent.is_all_day),
    });
  }, [initialEvent]);

  const dialogTitle = useMemo(
    () => (mode === "create" ? "Create Event" : "Edit Event"),
    [mode],
  );

  const handleChange = (
    field: keyof EventFormValues,
    value: string | boolean,
  ) => {
    setFormValues((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: ReqCreateEvent | ReqUpdateEvent = {
      title: formValues.title,
      description: formValues.description,
      type: formValues.type,
      start_time: toIsoString(formValues.start_time)!,
      end_time: toIsoString(formValues.end_time),
      status: formValues.status,
      priority: formValues.priority,
      is_all_day: formValues.is_all_day,
    };

    await onSubmit(payload);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl bg-surface border-border border">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">
                Title
              </label>
              <Input
                required
                value={formValues.title}
                className="bg-surface border-border border"
                onChange={(e) => handleChange("title", e.target.value)}
                placeholder="Team sync, focus block..."
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">
                Description
              </label>
              <Textarea
                value={formValues.description}
                className="bg-surface border-border border"
                onChange={(e) => handleChange("description", e.target.value)}
                rows={3}
                placeholder="Add notes or agenda"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-sm font-medium text-foreground">
                  Type
                </label>
                <Select
                  value={formValues.type}
                  onValueChange={(val) =>
                    handleChange("type", val as ReqCreateEventType)
                  }
                >
                  <SelectTrigger className="bg-surface border-border border">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent className="bg-surface border-border border">
                    <SelectItem value="task">Task</SelectItem>
                    <SelectItem value="event">Event</SelectItem>
                    <SelectItem value="note">Note</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-foreground">
                  Status
                </label>
                <Select
                  value={formValues.status}
                  onValueChange={(val) =>
                    handleChange("status", val as ReqCreateEventStatus)
                  }
                >
                  <SelectTrigger className="bg-surface border-border border">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent className="bg-surface border-border border">
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-sm font-medium text-foreground">
                  Priority
                </label>
                <Select
                  value={formValues.priority}
                  onValueChange={(val) =>
                    handleChange("priority", val as ReqCreateEventPriority)
                  }
                >
                  <SelectTrigger className="bg-surface border-border border">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent className="bg-surface border-border border">
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1 ">
                <label className="text-sm font-medium text-foreground">
                  All day
                </label>
                <div className="border-border bg-surface flex items-center justify-between rounded-md border px-3 py-2">
                  <span className="text-sm text-muted-foreground">Toggle</span>
                  <Switch
                    className=" "
                    checked={formValues.is_all_day}
                    onCheckedChange={(checked) =>
                      handleChange("is_all_day", checked)
                    }
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-sm font-medium text-foreground">
                  Start
                </label>
                <Input
                  className="bg-surface border-border border"
                  type="datetime-local"
                  value={formValues.start_time}
                  onChange={(e) => handleChange("start_time", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-foreground">
                  End
                </label>
                <Input
                  className="bg-surface border-border border"
                  type="datetime-local"
                  value={formValues.end_time}
                  onChange={(e) => handleChange("end_time", e.target.value)}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving..." : mode === "create" ? "Create" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
