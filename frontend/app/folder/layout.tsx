"use client";

import { ReactNode } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/shared/components/ui/breadcrumb";
import Link from "next/link";
import React from "react";
import {
  BreadcrumbProvider,
  useBreadcrumb,
} from "@/shared/contexts/BreadcrumbContext";

function FolderLayoutContent({ children }: { children: ReactNode }) {
  const { items } = useBreadcrumb();

  console.log(items);
  return (
    <div className="min-h-screen ">
      {/* Header with Breadcrumb */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur  ">
        <div className="max-w-[1600px] mx-auto  py-4">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/">Home</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/folder">Folders</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              {items.map((item) => (
                <React.Fragment key={item.id}>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                      <Link href={item.href}>{item.name}</Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                </React.Fragment>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      {/* Main Content */}
      <main className="">{children}</main>
    </div>
  );
}

export default function FolderLayout({ children }: { children: ReactNode }) {
  return (
    <BreadcrumbProvider>
      <FolderLayoutContent>{children}</FolderLayoutContent>
    </BreadcrumbProvider>
  );
}
