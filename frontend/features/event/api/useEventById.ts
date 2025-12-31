import { useGetEventById } from "@/shared/services/generated/api";

export const useEventById = (id: number) => {
  return useGetEventById(id, {
    query: {
      enabled: !!id,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  });
};
