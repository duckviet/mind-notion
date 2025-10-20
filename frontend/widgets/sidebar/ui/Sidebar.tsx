"use client";
import {
  HomeIcon,
  SettingsIcon,
  UserIcon,
  LogOutIcon,
  InfoIcon,
} from "lucide-react";
import Link from "next/link";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useAuthStore } from "@/features/auth/store/authStore";
import authAction from "@/shared/services/actions/auth.action";

const Sidebar = () => {
  const { isAuthenticated, logout: clearAuthStore } = useAuthStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const SIDEBAR_ITEMS = [
    {
      label: "Home",
      icon: <HomeIcon className="w-6 h-6" />,
      href: "/",
    },
    {
      label: "Settings",
      icon: <SettingsIcon className="w-6 h-6" />,
      href: "/",
    },
  ];

  const toggleMenu = useCallback(() => setMenuOpen((v) => !v), []);

  const handleLogout = useCallback(async () => {
    try {
      await authAction.logout();
    } finally {
      clearAuthStore();
      setMenuOpen(false);
    }
  }, [clearAuthStore]);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!menuRef.current) return;
      if (menuRef.current.contains(e.target as Node)) return;
      setMenuOpen(false);
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);
  return (
    <div className="h-full w-16 fixed flex-col items-center flex px-4 py-16  left-2 top-0">
      <div></div>
      <div className="flex-1 flex flex-col gap-6 justify-end">
        {SIDEBAR_ITEMS.map((item) => (
          <Link key={item.label} href={item.href}>
            {item.icon}
          </Link>
        ))}

        {/* User Menu */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            aria-label="User menu"
            onClick={toggleMenu}
            className="flex items-center justify-center"
          >
            <UserIcon className="w-6 h-6" />
          </button>

          {menuOpen && (
            <div className="absolute left-8 bottom-0 mb-0 w-44 rounded-md border bg-white shadow-md p-1 z-50">
              {!isAuthenticated ? (
                <Link
                  href="/auth"
                  className="flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-100"
                  onClick={() => setMenuOpen(false)}
                >
                  <UserIcon className="w-4 h-4" />
                  <span>Login</span>
                </Link>
              ) : (
                <div className="flex flex-col">
                  <Link
                    href="/profile"
                    className="flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-100"
                    onClick={() => setMenuOpen(false)}
                  >
                    <InfoIcon className="w-4 h-4" />
                    <span>User details</span>
                  </Link>
                  <button
                    type="button"
                    className="flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-100 text-left"
                    onClick={handleLogout}
                  >
                    <LogOutIcon className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
