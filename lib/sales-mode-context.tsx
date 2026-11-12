"use client";

import { createContext, useContext } from "react";

// Set once per request by app/layout.tsx from the server-read cookie, so client
// components render the right variant on the server — prices never flash.
const SalesModeContext = createContext(false);

export function SalesModeProvider({ value, children }: { value: boolean; children: React.ReactNode }) {
  return <SalesModeContext.Provider value={value}>{children}</SalesModeContext.Provider>;
}

/** True while the visitor came in on a rep's sales link (lib/sales-mode.ts). */
export function useSalesMode(): boolean {
  return useContext(SalesModeContext);
}
