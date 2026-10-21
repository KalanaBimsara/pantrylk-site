import type { MetadataRoute } from "next";
import { getProducts, getProjects } from "@/lib/content";
import { absUrl } from "@/lib/seo";
import { SITE_URL } from "@/lib/site-url";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [projects, products] = await Promise.all([getProjects(), getProducts()]);
  const now = new Date();
  const pages: [string, number, "weekly" | "monthly" | "yearly"][] = [
    ["", 1, "weekly"], ["/products", 0.9, "weekly"], ["/kitchen-planner", 0.9, "monthly"], ["/our-works", 0.8, "weekly"],
    ["/contact", 0.7, "yearly"], ["/about", 0.6, "yearly"], ["/privacy-policy", 0.2, "yearly"], ["/terms-and-conditions", 0.2, "yearly"],
  ];
  return [
    ...pages.map(([p, priority, changeFrequency]) => ({ url: `${SITE_URL}${p}`, lastModified: now, priority, changeFrequency })),
    ...products.map((p) => ({ url: `${SITE_URL}/products/${p.slug}`, lastModified: now, priority: 0.8, changeFrequency: "monthly" as const, images: p.images.map((i) => absUrl(i.src)) })),
    ...projects.map((p) => ({ url: `${SITE_URL}/our-works/${p.slug}`, lastModified: now, priority: 0.7, changeFrequency: "yearly" as const, images: [p.cover, ...p.images].map((i) => absUrl(i.src)) })),
  ];
}
