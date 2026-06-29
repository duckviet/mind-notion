"use client";

import React from "react";
import { useParams } from "next/navigation";
import { useGetPublicNote, getGetPublicNoteQueryKey } from "@/shared/services/generated/api";
import { NotePage } from "@/page/note";

export default function PublicNoteViewPage() {
  const params = useParams();
  const id = params?.id as string;

  const {
    data: note,
    isLoading,
    error,
  } = useGetPublicNote(id, {
    query: {
      queryKey: getGetPublicNoteQueryKey(id),
      retry: false,
      refetchOnWindowFocus: false,
    },
  });

  return <NotePage note={note} isLoading={isLoading} mode="view" />;
}
