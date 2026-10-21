import { getProduct } from "./catalog";
import { BASE_BODY, WALL_H } from "./finishes";
import { cabinetArea, cabinetPrice, CABINET_RATE_SQFT, GRANITE_RATE_SQFT } from "./pricing";

/**
 * Standard units shown on the Products page. Each one is backed by a Kitchen Planner model, which
 * gives it rendered 3D photos (public/images/products) and a live 3D view on its product page.
 */
export type SiteUnit = {
  slug: string;
  name: string;
  categorySlug: "base-cabinets" | "wall-cabinets";
  plannerId: string;
  /** Width shown in the photos and the 3D view by default. */
  showWidth: number;
  summary: string;
  description: string;
};

export const SITE_UNITS: SiteUnit[] = [
  {
    slug: "standard-base-cabinet", name: "Standard Base Cabinet", categorySlug: "base-cabinets", plannerId: "base-door", showWidth: 600,
    summary: "Door base unit in four standard widths.",
    description: "Our standard base cupboard with an adjustable shelf: 750 mm high and 560 mm deep, in 200, 400, 600 or 800 mm widths. Units of 800 mm have two doors.",
  },
  {
    slug: "three-drawer-base-unit", name: "Three-Drawer Base Unit", categorySlug: "base-cabinets", plannerId: "base-drawers-3", showWidth: 600,
    summary: "One shallow and two deep drawers.",
    description: "A drawer base unit for cutlery, pots and pans: one shallow and two deep drawers, 750 mm high and 560 mm deep.",
  },
  {
    slug: "l-shaped-corner-base-unit", name: "L-Shaped Corner Base Unit", categorySlug: "base-cabinets", plannerId: "base-corner-l", showWidth: 900,
    summary: "Uses the whole corner, with a door on each side.",
    description: "An L-shaped corner unit that turns the base cabinets round the corner with no dead space. It measures 900 mm along each wall, 750 mm high, with a door on each inside face.",
  },
  {
    slug: "blind-corner-base-unit", name: "Blind Corner Base Unit", categorySlug: "base-cabinets", plannerId: "base-corner", showWidth: 1000,
    summary: "A single door; the blind side runs under the next worktop.",
    description: "A corner base unit for where two runs meet: the blind side tucks under the run on the other wall, leaving one door at the front. 800 or 1000 mm wide, 750 mm high, 560 mm deep.",
  },
  {
    slug: "standard-wall-cabinet", name: "Standard Wall Cabinet", categorySlug: "wall-cabinets", plannerId: "wall-door", showWidth: 800,
    summary: "Door wall unit in four standard widths.",
    description: "Our standard wall cupboard with two shelves: 750 mm high and 350 mm deep, in 200, 400, 600 or 800 mm widths.",
  },
  {
    slug: "glass-door-wall-cabinet", name: "Glass-Door Wall Cabinet", categorySlug: "wall-cabinets", plannerId: "wall-glass", showWidth: 600,
    summary: "Framed glass doors for display.",
    description: "A wall cabinet with framed glass doors to show off glassware and crockery. Add an LED strip inside to light the shelves.",
  },
  {
    slug: "lift-up-wall-cabinet", name: "Lift-Up Wall Cabinet", categorySlug: "wall-cabinets", plannerId: "wall-lift", showWidth: 800,
    summary: "A horizontal front that lifts up and stays open.",
    description: "A low horizontal wall cabinet with a lift-up front, ideal above the hood or along the top of a run.",
  },
  {
    slug: "l-shaped-corner-wall-unit", name: "L-Shaped Corner Wall Unit", categorySlug: "wall-cabinets", plannerId: "wall-corner-l", showWidth: 900,
    summary: "Fills the wall corner above an L-shaped base unit.",
    description: "An L-shaped wall unit that carries the wall cabinets round the corner, with a door on each inside face. 750 mm high and 350 mm deep on each arm.",
  },
  {
    slug: "open-wall-shelf-unit", name: "Open Wall Shelf Unit", categorySlug: "wall-cabinets", plannerId: "wall-open", showWidth: 600,
    summary: "Open shelving to break up a run of wall units.",
    description: "An open wall unit with shelves, 750 mm high and 350 mm deep, in 200, 400 or 600 mm widths.",
  },
];

export const siteUnit = (slug: string) => SITE_UNITS.find((u) => u.slug === slug);

/** Rendered photo file names (see /dev/product-renders). */
export const unitImages = (u: SiteUnit) => [
  { file: `${u.slug}`, front: "matte-white", open: false, alt: `${u.name} in Matte White` },
  { file: `${u.slug}-open`, front: "matte-white", open: true, alt: `${u.name} with doors open` },
  { file: `${u.slug}-oak`, front: "natural-oak", open: false, alt: `${u.name} in Natural Oak` },
];

export function unitSizes(u: SiteUnit) {
  const p = getProduct(u.plannerId)!;
  const h = p.height - p.plinth;
  return p.widths.map((w) => ({
    width: w,
    label: p.model === "cornerL" ? `${w} × ${p.depth} mm (L)` : `${w} mm`,
    dims: p.model === "cornerL" ? `${w} × ${p.depth} × ${h} mm` : `${w} × ${h} × ${p.depth} mm`,
    sqft: cabinetArea(p, w),
    price: cabinetPrice(p, w)!,
  }));
}

export function unitSpecs(u: SiteUnit) {
  const p = getProduct(u.plannerId)!;
  const sizes = unitSizes(u);
  const h = p.height - p.plinth;
  return [
    { label: "Standard sizes", value: sizes.map((s) => s.dims).join(" · ") },
    { label: "Height", value: `${h} mm${p.layer === "base" ? ` (${BASE_BODY} mm cabinet on adjustable legs)` : p.layer === "wall" && h === WALL_H ? " (standard wall unit)" : ""}` },
    { label: "Depth", value: p.model === "cornerL" ? `${p.arm} mm on each arm` : `${p.depth} mm` },
    { label: "Price", value: `LKR ${CABINET_RATE_SQFT.toLocaleString("en-LK")} per sq ft of front (width × height)` },
    ...sizes.map((s) => ({ label: `${s.label} wide`, value: `${s.sqft.toFixed(2)} sq ft · LKR ${s.price.toLocaleString("en-LK")}` })),
    ...(p.layer === "base" ? [{ label: "Worktop", value: `Not included. Granite from LKR ${GRANITE_RATE_SQFT.toLocaleString("en-LK")} per sq ft` }] : []),
  ];
}
