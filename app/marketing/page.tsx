import { redirect } from "next/navigation";

// belan.tech/marketing used to be the marketing-product landing page; that
// page is now the homepage. Keep the old URL working for anything that still
// links to it (business cards, old ads, search results).
export default function MarketingRedirect() {
  redirect("/");
}
