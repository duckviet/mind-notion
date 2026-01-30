import { createCollabToken } from "@/shared/services/generated/api";
import { useQuery } from "@tanstack/react-query";

export const useCollabSession = (
  noteId: string,
  editToken?: string,
  enabled: boolean = true,
) =>
  useQuery({
    queryKey: ["collab-session", noteId, editToken],
    queryFn: () =>
      createCollabToken({ note_id: noteId, edit_token: editToken }),
    enabled: enabled && !!noteId,
    retry: false,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
