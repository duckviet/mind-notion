"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/features/auth";
import { SidebarProvider, SidebarInset } from "@/shared/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { RightChatbotSidebar } from "./RightChatbotSidebar";

const SidebarWrapper = ({ children }: { children?: React.ReactNode }) => {
  const [mounted, setMounted] = useState(false);
  const { isAuth, isRefreshing } = useAuthStore();
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  if (!isAuth) return <>{children}</>;

  if (isRefreshing) return <>{children}</>;

  const isNotePage = pathname.startsWith("/note/");

  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar />
      <SidebarInset className="overflow-x-hidden w-full bg-background transition-[margin] duration-200">
        {children}
      </SidebarInset>
      {!isNotePage && (
        <div className="sticky top-0 h-svh shrink-0 py-6 px-2">
          <RightChatbotSidebar />
        </div>
      )}
    </SidebarProvider>
  );
};

export default SidebarWrapper;
