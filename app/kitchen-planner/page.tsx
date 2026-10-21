import type { Metadata } from "next";
import { redirect } from "next/navigation";
import PlannerLoader from "@/components/planner/PlannerLoader";
import { getSettings } from "@/lib/content";
import { quotationLink } from "@/lib/links";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Kitchen Planner — Design Your Kitchen in 3D",
  description:
    "Plan your kitchen in 3D with Pantry LK's free online Kitchen Planner. Set your room size, add cabinets and appliances, try finishes, then send your design to our team for a quotation.",
  alternates: { canonical: "/kitchen-planner" },
};

export default async function KitchenPlannerPage() {
  const s = await getSettings();
  // An external planner configured in settings still takes precedence.
  if (s.kitchenPlannerUrl) redirect(s.kitchenPlannerUrl);
  const quote = quotationLink(s);
  return <PlannerLoader contact={{ whatsappNumber: s.whatsappNumber, quoteHref: quote.href, quoteExternal: quote.external, newTab: s.openAppsInNewTab }} />;
}
