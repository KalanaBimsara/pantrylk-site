import type { SiteSettings } from "./types";

export type AppLink = { href: string; external: boolean; available: boolean };

/** Kitchen Planner: external app when configured, otherwise our built-in 3D planner. */
export function plannerLink(s: SiteSettings): AppLink {
  return s.kitchenPlannerUrl
    ? { href: s.kitchenPlannerUrl, external: true, available: true }
    : { href: "/kitchen-planner", external: false, available: true };
}

/** Quotation Maker: external app when configured, otherwise the contact page. */
export function quotationLink(s: SiteSettings): AppLink {
  return s.quotationMakerUrl
    ? { href: s.quotationMakerUrl, external: true, available: true }
    : { href: "/contact", external: false, available: false };
}

export function externalProps(link: AppLink, newTab: boolean) {
  return link.external && newTab ? { target: "_blank", rel: "noopener noreferrer" } : {};
}
