import { toast } from "sonner";
import { useUploadMedia } from "@/shared/services/generated/api";
import { useStableRef } from "./useStableRef";

export function useUploadMediaRef() {
  const { mutateAsync: uploadMedia } = useUploadMedia({
    mutation: {
      onError: () => toast.error("Failed to upload image"),
    },
  });

  return useStableRef(uploadMedia);
}
