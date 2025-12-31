import {
  useListEventsByRange,
  ListEventsByRangeParams,
} from "@/shared/services/generated/api";

export const useEventsRange = (params: ListEventsByRangeParams) => {
  return useListEventsByRange(params, {
    query: {
      enabled: !!(params.start_time && params.end_time),
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
    },
  });
};

export type { ListEventsByRangeParams };
