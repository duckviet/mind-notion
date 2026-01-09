"use client";

import { use } from "react";
import { FolderPage } from "@/page/folder";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function Page({ params }: PageProps) {
  const { id } = use(params);
  return <FolderPage folderId={id} />;
}
