"use client";

import {
  HomeIcon,
  SettingsIcon,
  LogOutIcon,
  ShoppingBag,
  PackageIcon,
  Clock,
  FileIcon,
  Users,
  Palette,
  HelpCircle,
  Search,
} from "lucide-react";

export const MAIN_ITEMS = [
  {
    label: "Home",
    icon: HomeIcon,
    href: "/",
  },

  {
    label: "My projects",
    icon: PackageIcon,
    href: "/folder",
  },
  {
    label: "Scheduled",
    icon: Clock,
    href: "/calendar",
  },
];

export const SECONDARY_ITEMS = [
  {
    label: "All files",
    icon: FileIcon,
    href: "/files",
  },
  {
    label: "Team members",
    icon: Users,
    href: "/team",
  },
  {
    label: "Appearance",
    icon: Palette,
    href: "/settings",
  },
];

export const FOOTER_ITEMS = [
  {
    label: "Support",
    icon: HelpCircle,
    href: "/support",
  },
  {
    label: "Settings",
    icon: SettingsIcon,
    href: "/settings",
  },
];
