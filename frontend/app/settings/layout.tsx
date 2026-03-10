import React from "react";
import { SettingsPage } from "@/page/settings";

interface SettingsLayoutProps {
  children: React.ReactNode;
}

export default function SettingsLayout({ children }: SettingsLayoutProps) {
  return <SettingsPage>{children}</SettingsPage>;
}
