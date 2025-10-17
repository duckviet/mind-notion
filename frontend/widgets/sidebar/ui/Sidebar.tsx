import { HomeIcon, SettingsIcon, UserIcon } from "lucide-react";
import Link from "next/link";
import React from "react";

const Sidebar = () => {
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
    {
      label: "User",
      icon: <UserIcon className="w-6 h-6" />,
      href: "/",
    },
  ];
  return (
    <div className="h-full w-16 fixed flex-col items-center flex px-4 py-16  left-2 top-0">
      <div></div>
      <div className="flex-1 flex flex-col gap-6 justify-end">
        {SIDEBAR_ITEMS.map((item) => (
          <Link key={item.label} href={item.href}>
            {item.icon}
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;
