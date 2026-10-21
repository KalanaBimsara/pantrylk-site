import "server-only";
import { SITE_UNITS } from "@/lib/planner/site-products";
import { withUnitDetails } from "@/lib/planner/unit-products";
import { priceLabel } from "@/lib/format";

export type UnitDetails = {
  name: string;
  price: string;
  specs: { label: string; value: string }[];
  defaultFinishes: { name: string; hex: string }[];
};

/**
 * What the public site shows for each standard unit, whatever is stored in the database: price and
 * specs always come from the planner pricing rules (`withUnitDetails`), finishes only when none are set.
 */
export function standardUnitDetails(): Record<string, UnitDetails> {
  return Object.fromEntries(
    SITE_UNITS.map((u) => {
      const p = withUnitDetails({
        slug: u.slug,
        name: u.name,
        categorySlug: u.categorySlug,
        categoryName: "",
        summary: "",
        description: "",
        priceMode: "on_request",
        price: null,
        finishes: [],
        specs: [],
        images: [],
        featured: false,
        seoTitle: null,
        seoDescription: null,
      });
      return [u.slug, { name: u.name, price: priceLabel(p.priceMode, p.price), specs: p.specs, defaultFinishes: p.finishes }];
    }),
  );
}

export const isStandardUnit = (slug: string) => SITE_UNITS.some((u) => u.slug === slug);
