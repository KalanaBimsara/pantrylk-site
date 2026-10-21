import type { Product } from "@/lib/types";
import { FRONTS } from "./finishes";
import { SITE_UNITS, unitImages, unitSizes, unitSpecs, type SiteUnit } from "./site-products";

/** Fronts offered on the standard units (the planner has more; these are the Products page swatches). */
const UNIT_FINISHES = ["matte-white", "natural-oak", "grey-gloss", "navy", "sage", "walnut"].map((id) => {
  const f = FRONTS.find((x) => x.id === id)!;
  return { name: f.name, hex: f.color };
});

const fromPrice = (u: SiteUnit) => Math.min(...unitSizes(u).map((s) => s.price));

/** Product entries for the standard units, built from the planner catalog and Pantry LK's rates. */
export function unitProducts(categoryName: (slug: string) => string): Product[] {
  return SITE_UNITS.map((u) => ({
    slug: u.slug,
    name: u.name,
    categorySlug: u.categorySlug,
    categoryName: categoryName(u.categorySlug),
    summary: u.summary,
    description: u.description,
    priceMode: "starting",
    price: fromPrice(u),
    finishes: UNIT_FINISHES,
    specs: unitSpecs(u),
    images: unitImages(u).map((im) => ({ src: `/images/products/${im.file}.jpg`, alt: im.alt, caption: null })),
    featured: false,
    seoTitle: null,
    seoDescription: `${u.name}: ${u.summary} Standard Pantry LK sizes from LKR ${fromPrice(u).toLocaleString("en-LK")}.`,
  }));
}

/**
 * Keep prices, sizes and finishes of standard units in step with the pricing rules, whichever source
 * (database or seed) the product came from. Photos and text from the database are kept when present.
 */
export function withUnitDetails(p: Product): Product {
  const u = SITE_UNITS.find((x) => x.slug === p.slug);
  if (!u) return p;
  return {
    ...p,
    priceMode: "starting",
    price: fromPrice(u),
    specs: unitSpecs(u),
    finishes: p.finishes.length ? p.finishes : UNIT_FINISHES,
    images: p.images.length ? p.images : unitImages(u).map((im) => ({ src: `/images/products/${im.file}.jpg`, alt: im.alt, caption: null })),
  };
}
