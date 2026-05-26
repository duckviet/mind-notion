import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useEditTokenStore } from "@/shared/stores/editTokenStore";

export function useEditToken() {
  const searchParams = useSearchParams();
  const { setEditToken } = useEditTokenStore();

  useEffect(() => {
    const token = searchParams.get("token");
    if (token) setEditToken(token);

    return () => setEditToken(null);
  }, [searchParams, setEditToken]);
}
