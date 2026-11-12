import type { Metadata } from "next";
import { cookies } from "next/headers";
import { SALES_COOKIE, parseSalesRep } from "./sales-mode";

/** Server components / generateMetadata: is this request on a rep's sales link? */
export async function isSalesMode(): Promise<boolean> {
  return parseSalesRep((await cookies()).get(SALES_COOKIE)?.value) !== null;
}

/**
 * generateMetadata for a page whose description or Open Graph copy names a
 * price: unchanged without the sales cookie, the given price-free copy with it.
 */
export function salesAwareMetadata(
  base: Metadata,
  sales: { description?: string; ogDescription?: string },
): () => Promise<Metadata> {
  return async () => {
    if (!(await isSalesMode())) return base;
    return {
      ...base,
      ...(sales.description !== undefined && { description: sales.description }),
      ...(sales.ogDescription !== undefined && {
        openGraph: { ...base.openGraph, description: sales.ogDescription },
      }),
    };
  };
}
