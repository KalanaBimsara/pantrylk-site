import "server-only";
import { cache } from "react";
import { getPublicSupabase, mediaUrl } from "@/lib/supabase/public";
import type { Category, Img, MaterialRow, Product, Project, SiteSettings, Testimonial, Finish, PriceMode } from "@/lib/types";
import { seedCategories, seedProducts, seedProjects, seedSettings } from "@/content/seed";

/**
 * Content source rules
 * - Supabase configured and reachable  → database is the source of truth (even if empty).
 * - Not configured, table missing, or NEXT_PUBLIC_CONTENT_SOURCE=seed → bundled seed content.
 */
const forceSeed = process.env.NEXT_PUBLIC_CONTENT_SOURCE === "seed";
const warned = new Set<string>();
function fallback<T>(what: string, err: unknown, value: T): T {
  if (!warned.has(what)) {
    warned.add(what);
    const msg = err instanceof Error ? err.message : typeof err === "object" && err && "message" in err ? String((err as { message: unknown }).message) : String(err);
    console.warn(`[content] Using seed ${what}: ${msg}`);
  }
  return value;
}

function db() {
  return forceSeed ? null : getPublicSupabase();
}

type Row = Record<string, unknown>;
const str = (v: unknown) => (typeof v === "string" && v.trim() ? v : null);
const img = (path: unknown, alt: unknown, caption?: unknown): Img | null => {
  const src = mediaUrl(str(path));
  return src ? { src, alt: str(alt) ?? "", caption: str(caption) } : null;
};
const rows = (v: unknown): MaterialRow[] =>
  Array.isArray(v) ? v.filter((r): r is MaterialRow => !!r && typeof r.label === "string" && typeof r.value === "string" && !!r.value.trim()) : [];
const sortImgs = (v: unknown): Img[] =>
  (Array.isArray(v) ? (v as Row[]) : [])
    .slice()
    .sort((a, b) => Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0))
    .map((r) => img(r.path, r.alt, r.caption))
    .filter((x): x is Img => !!x);

/* ---------------- Settings ---------------- */

export const getSettings = cache(async (): Promise<SiteSettings> => {
  const sb = db();
  if (!sb) return seedSettings;
  const { data, error } = await sb.from("site_settings").select("*").eq("id", 1).maybeSingle();
  if (error || !data) return fallback("settings", error ?? "no row", seedSettings);
  const d = data as Row;
  return {
    companyName: str(d.company_name) ?? seedSettings.companyName,
    tagline: str(d.tagline) ?? seedSettings.tagline,
    phoneDisplay: str(d.phone_display) ?? seedSettings.phoneDisplay,
    phoneIntl: str(d.phone_intl) ?? seedSettings.phoneIntl,
    whatsappNumber: str(d.whatsapp_number) ?? seedSettings.whatsappNumber,
    email: str(d.email) ?? seedSettings.email,
    address: str(d.address),
    businessHours: str(d.business_hours),
    mapUrl: str(d.map_url),
    facebookUrl: str(d.facebook_url),
    instagramUrl: str(d.instagram_url),
    tiktokUrl: str(d.tiktok_url),
    kitchenPlannerUrl: str(d.kitchen_planner_url),
    quotationMakerUrl: str(d.quotation_maker_url),
    openAppsInNewTab: d.open_apps_in_new_tab !== false,
    contactUploadsEnabled: d.contact_uploads_enabled === true,
  };
});

/* ---------------- Projects ---------------- */

const PROJECT_SELECT = "*, project_images(path, alt, caption, sort_order)";

function mapProject(r: Row): Project | null {
  const cover = img(r.cover_path, r.cover_alt);
  if (!cover || !str(r.slug) || !str(r.title)) return null;
  return {
    slug: String(r.slug),
    title: String(r.title),
    layout: str(r.layout) ?? "",
    style: str(r.style) ?? "",
    projectType: str(r.project_type),
    location: str(r.location),
    completedOn: str(r.completed_on),
    summary: str(r.summary),
    requirements: str(r.requirements),
    solution: str(r.solution),
    materials: rows(r.materials),
    cover,
    images: sortImgs(r.project_images),
    before: img(r.before_path, r.before_alt),
    after: img(r.after_path, r.after_alt),
    featured: r.is_featured === true,
    seoTitle: str(r.seo_title),
    seoDescription: str(r.seo_description),
  };
}

export const getProjects = cache(async (): Promise<Project[]> => {
  const sb = db();
  if (!sb) return seedProjects;
  const { data, error } = await sb
    .from("projects")
    .select(PROJECT_SELECT)
    .eq("status", "published")
    .order("sort_order", { ascending: true })
    .order("published_at", { ascending: false });
  if (error) return fallback("projects", error, seedProjects);
  return (data as Row[]).map(mapProject).filter((p): p is Project => !!p);
});

export async function getProject(slug: string): Promise<Project | null> {
  const all = await getProjects();
  return all.find((p) => p.slug === slug) ?? null;
}

export async function getFeaturedProjects(limit = 5): Promise<Project[]> {
  const all = await getProjects();
  return all.filter((p) => p.featured).slice(0, limit);
}

/* ---------------- Products ---------------- */

const PRICE_MODES: PriceMode[] = ["fixed", "starting", "on_request", "none"];

export const getCategories = cache(async (): Promise<Category[]> => {
  const sb = db();
  if (!sb) return seedCategories;
  const { data, error } = await sb
    .from("product_categories")
    .select("slug, name, description, image_path, image_alt, sort_order")
    .eq("is_published", true)
    .order("sort_order", { ascending: true });
  if (error) return fallback("categories", error, seedCategories);
  return (data as Row[]).map((r) => ({
    slug: String(r.slug),
    name: String(r.name),
    description: str(r.description) ?? "",
    image: img(r.image_path, r.image_alt),
  }));
});

export const getProducts = cache(async (): Promise<Product[]> => {
  const sb = db();
  if (!sb) return seedProducts;
  const { data, error } = await sb
    .from("products")
    .select("*, product_categories(slug, name), product_images(path, alt, caption, sort_order)")
    .eq("status", "published")
    .order("sort_order", { ascending: true });
  if (error) return fallback("products", error, seedProducts);
  return (data as Row[])
    .map((r): Product | null => {
      if (!str(r.slug) || !str(r.name)) return null;
      const c = (r.product_categories ?? {}) as Row;
      const mode = PRICE_MODES.includes(r.price_mode as PriceMode) ? (r.price_mode as PriceMode) : "on_request";
      const price = typeof r.price === "number" ? r.price : r.price != null ? Number(r.price) : null;
      return {
        slug: String(r.slug),
        name: String(r.name),
        categorySlug: str(c.slug) ?? "",
        categoryName: str(c.name) ?? "",
        summary: str(r.summary) ?? "",
        description: str(r.description) ?? "",
        priceMode: (mode === "fixed" || mode === "starting") && (price == null || Number.isNaN(price)) ? "on_request" : mode,
        price: price != null && !Number.isNaN(price) ? price : null,
        finishes: (Array.isArray(r.finishes) ? r.finishes : []).filter((f): f is Finish => !!f && typeof f.name === "string" && typeof f.hex === "string"),
        specs: rows(r.specs),
        images: sortImgs(r.product_images),
        featured: r.is_featured === true,
        seoTitle: str(r.seo_title),
        seoDescription: str(r.seo_description),
      };
    })
    .filter((p): p is Product => !!p);
});

export async function getProduct(slug: string): Promise<Product | null> {
  const all = await getProducts();
  return all.find((p) => p.slug === slug) ?? null;
}

/* ---------------- Testimonials ---------------- */

export const getTestimonials = cache(async (): Promise<Testimonial[]> => {
  const sb = db();
  if (!sb) return [];
  const { data, error } = await sb
    .from("testimonials")
    .select("id, quote, customer_name, area, projects(slug)")
    .eq("is_approved", true)
    .order("sort_order", { ascending: true });
  if (error) return fallback("testimonials", error, []);
  return (data as Row[]).map((r) => ({
    id: String(r.id),
    quote: String(r.quote),
    name: String(r.customer_name),
    area: str(r.area),
    projectSlug: str(((r.projects ?? {}) as Row).slug),
  }));
});
