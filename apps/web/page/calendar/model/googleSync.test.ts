import { describe, expect, it } from "vitest";

import {
  buildMovedEventTimes,
  getCreatedEventId,
  isCreateEventPayload,
  shouldPushGoogleAfterDrag,
} from "./googleSync";

describe("getCreatedEventId", () => {
  it("returns the event id when create returns the event directly", () => {
    const result = getCreatedEventId({
      id: "evt_1",
      title: "Design review",
      user_id: 1,
      type: "event",
      start_time: "2026-06-01T09:00:00.000Z",
    });

    expect(result).toBe("evt_1");
  });
});

describe("buildMovedEventTimes", () => {
  it("preserves the original time and duration when dragged to another day", () => {
    const result = buildMovedEventTimes({
      destinationDay: "wednesday",
      isAllDay: false,
      originalStartTime: "2026-06-01T09:30:00.000Z",
      originalEndTime: "2026-06-01T10:45:00.000Z",
      weekStartTime: "2026-06-01T00:00:00.000Z",
    });

    expect(result).toEqual({
      start_time: "2026-06-03T09:30:00.000Z",
      end_time: "2026-06-03T10:45:00.000Z",
    });
  });
});

describe("isCreateEventPayload", () => {
  it("accepts payloads with required create event fields", () => {
    expect(
      isCreateEventPayload({
        title: "Design review",
        type: "event",
        start_time: "2026-06-01T09:00:00.000Z",
      }),
    ).toBe(true);
  });
});

describe("shouldPushGoogleAfterDrag", () => {
  it("pushes an already synced event when Google Calendar is connected", () => {
    expect(
      shouldPushGoogleAfterDrag({
        googleCalendarConnected: true,
        googleEventId: "google_1",
      }),
    ).toBe(true);
  });
});
