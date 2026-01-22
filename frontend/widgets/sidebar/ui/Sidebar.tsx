"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/features/auth/store/authStore";
import { SidebarProvider, SidebarInset } from "@/shared/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";

const SidebarWrapper = ({ children }: { children?: React.ReactNode }) => {
  const [mounted, setMounted] = useState(false);
  const { isAuth } = useAuthStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  if (!isAuth) return <>{children}</>;

  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar />
      <SidebarInset className="overflow-x-hidden w-full bg-background transition-[margin] duration-200 px-12">
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
};

export default SidebarWrapper;
