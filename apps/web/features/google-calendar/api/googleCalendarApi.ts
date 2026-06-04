import { isAxiosError } from "axios";
import { z } from "zod";

export const googleCalendarStatusQueryKey = [
  "/auth/google/calendar/status",
] as const;

export type GoogleCalendarStatus = {
  readonly connected: boolean;
  readonly configured?: boolean;
};

export type GoogleCalendarConnectResponse = {
  readonly url: string;
};

export type GoogleCalendarSyncResponse = {
  readonly synced: number;
  readonly message: string;
};

export type GoogleCalendarMessageResponse = {
  readonly message: string;
};

const apiErrorResponseSchema = z.object({
  error: z.string().min(1).optional(),
});

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (isAxiosError(error)) {
    const parsed = apiErrorResponseSchema.safeParse(error.response?.data);
    if (parsed.success && parsed.data.error) {
      return parsed.data.error;
    }

    if (error.message) {
      return error.message;
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}
