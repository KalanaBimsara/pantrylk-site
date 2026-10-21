import type { Metadata } from "next";
import { redirect } from "next/navigation";
import PlannerLoader from "@/components/planner/PlannerLoader";
import { getSettings } from "@/lib/content";
import { quotationLink } from "@/lib/links";
import { absUrl, BUSINESS_ID, ldJson, pageMeta } from "@/lib/seo";

export const revalidate = 300;

export const metadata: Metadata = pageMeta({
  title: "Free 3D Kitchen Planner — Design Your Kitchen Online",
  description:
    "Plan your kitchen in 3D with Pantry LK's free online Kitchen Planner. Set your room size, add standard cabinets and corner units, try granite tops and LED lights, see live prices, then send your design for a quotation.",
  path: "/kitchen-planner",
});

const appLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Pantry LK Kitchen Planner",
  url: absUrl("/kitchen-planner"),
  applicationCategory: "DesignApplication",
  operatingSystem: "Any (web browser)",
  browserRequirements: "Requires JavaScript and WebGL",
  offers: { "@type": "Offer", price: 0, priceCurrency: "LKR" },
  publisher: { "@id": BUSINESS_ID },
  featureList: ["3D room planning", "Floor, wall, 3D and walk-through views", "Standard and corner cabinets", "Granite and Staron worktops", "LED strip lighting", "Live price estimate", "2D plans and elevations"],
};

export default async function KitchenPlannerPage() {
  const s = await getSettings();
  // An external planner configured in settings still takes precedence.
  if (s.kitchenPlannerUrl) redirect(s.kitchenPlannerUrl);
  const quote = quotationLink(s);
  return (
    <>
      <PlannerLoader contact={{ whatsappNumber: s.whatsappNumber, quoteHref: quote.href, quoteExternal: quote.external, newTab: s.openAppsInNewTab }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={ldJson(appLd)} />
    </>
  );
}
