import {
  useListEvents,
  ListEventsParams,
} from "@/shared/services/generated/api";

export const useEventsList = (params?: ListEventsParams) => {
  return useListEvents(params, {
    query: {
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  });
};

export type { ListEventsParams };
