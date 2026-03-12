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
    label: "Folders",
    icon: PackageIcon,
    href: "/folder",
  },
  {
    label: "Calendar",
    icon: Clock,
    href: "/calendar",
  },
];

export const SECONDARY_ITEMS = [
  // {
  //   label: "All files",
  //   icon: FileIcon,
  //   href: "/files",
  // },
  // {
  //   label: "Team members",
  //   icon: Users,
  //   href: "/team",
  // },
  {
    label: "Appearance",
    icon: Palette,
    href: "/settings/appearance",
  },
];

export const FOOTER_ITEMS = [
  {
    label: "Support",
    icon: HelpCircle,
    href: "/",
  },
  {
    label: "Settings",
    icon: SettingsIcon,
    href: "/settings",
  },
];
