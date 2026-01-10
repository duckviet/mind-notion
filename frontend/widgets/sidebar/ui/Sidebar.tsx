"use client";
import {
  HomeIcon,
  SettingsIcon,
  UserIcon,
  LogOutIcon,
  CalendarDaysIcon,
  FolderOpen,
} from "lucide-react";
import Link from "next/link";
import React, { useCallback, useEffect, useState } from "react";
import { useAuthStore } from "@/features/auth/store/authStore";
import authAction from "@/shared/services/actions/auth.action";

const Sidebar = () => {
  const [mounted, setMounted] = useState(false);
  const { isAuth, logout: clearAuthStore } = useAuthStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  const SIDEBAR_ITEMS = [
    {
      label: "Home",
      icon: <HomeIcon className="w-6 h-6" />,
      href: "/",
    },
    {
      label: "Folder",
      icon: <FolderOpen className="w-6 h-6" />,
      href: "/folder",
    },
    {
      label: "Calendar",
      icon: <CalendarDaysIcon className="w-6 h-6" />,
      href: "/calendar",
    },
    {
      label: "Settings",
      icon: <SettingsIcon className="w-6 h-6" />,
      href: "/settings",
    },
  ];

  const handleLogout = useCallback(async () => {
    try {
      await authAction.logout();
    } finally {
      clearAuthStore();
    }
  }, [clearAuthStore]);

  if (!mounted) return null;

  if (!isAuth) return null;
  return (
    <div className="h-full w-16 fixed flex-col items-center flex px-4 py-16  left-2 top-0 z-100">
      <div></div>
      <div className="flex-1 flex flex-col gap-6 justify-end">
        {/* User shortcut */}

        {SIDEBAR_ITEMS.map((item) => (
          <Link key={item.label} href={item.href}>
            {item.icon}
          </Link>
        ))}
        <button
          type="button"
          aria-label="Logout"
          className="flex items-center justify-center"
          onClick={handleLogout}
        >
          <LogOutIcon className="w-6 h-6 text-[color:var(--accent-600)]" />
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
