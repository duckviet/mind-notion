"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

export interface BreadcrumbItemType {
  id: string;
  name: string;
  href: string;
}

interface BreadcrumbContextType {
  items: BreadcrumbItemType[];
  setItems: (items: BreadcrumbItemType[]) => void;
}

const BreadcrumbContext = createContext<BreadcrumbContextType | undefined>(
  undefined
);

export function BreadcrumbProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<BreadcrumbItemType[]>([]);

  return (
    <BreadcrumbContext.Provider value={{ items, setItems }}>
      {children}
    </BreadcrumbContext.Provider>
  );
}

export function useBreadcrumb() {
  const context = useContext(BreadcrumbContext);
  if (!context) {
    throw new Error("useBreadcrumb must be used within BreadcrumbProvider");
  }
  return context;
}
