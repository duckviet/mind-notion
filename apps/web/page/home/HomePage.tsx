"use client";
import React from "react";
import { ModalProvider } from "@/shared/contexts/ModalContext";
import { HomePageContent } from "./ui/HomePageContent";

export default function HomePage() {
  return (
    <ModalProvider>
      <HomePageContent />
    </ModalProvider>
  );
}
