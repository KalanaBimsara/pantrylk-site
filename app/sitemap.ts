import type { MetadataRoute } from "next";
import { getProducts, getProjects } from "@/lib/content";
import { SITE_URL } from "@/lib/site-url";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [projects, products] = await Promise.all([getProjects(), getProducts()]);
  const pages = ["", "/our-works", "/products", "/about", "/contact", "/kitchen-planner", "/privacy-policy", "/terms-and-conditions"];
  return [
    ...pages.map((p) => ({ url: `${SITE_URL}${p}` })),
    ...projects.map((p) => ({ url: `${SITE_URL}/our-works/${p.slug}` })),
    ...products.map((p) => ({ url: `${SITE_URL}/products/${p.slug}` })),
  ];
}
