"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

export type AdminView = "restaurants" | "billing";

interface AdminViewValue {
  view: AdminView;
  setView: (v: AdminView) => void;
}

const AdminViewContext = createContext<AdminViewValue | null>(null);

/** Shares the Restaurants/Billing tab selection between the header and page body. */
export function AdminViewProvider({ children }: { children: ReactNode }) {
  const [view, setView] = useState<AdminView>("restaurants");
  return (
    <AdminViewContext.Provider value={{ view, setView }}>
      {children}
    </AdminViewContext.Provider>
  );
}

export function useAdminView(): AdminViewValue {
  const ctx = useContext(AdminViewContext);
  return ctx ?? { view: "restaurants", setView: () => {} };
}
