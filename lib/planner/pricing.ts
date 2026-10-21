import { BASE_D, byId, WORKTOPS } from "./finishes";
import type { Product } from "./types";

/** Pantry LK rates (LKR). */
export const CABINET_RATE_SQFT = 7100;
export const GRANITE_RATE_SQFT = 3200;

const MM_PER_FT = 304.8;

/** Square feet of a width × height in millimetres, unrounded. */
export const sqft = (wMm: number, hMm: number) => (wMm / MM_PER_FT) * (hMm / MM_PER_FT);

/**
 * Whole feet, rounded up, as granite is sold (2.1 ft → 3 ft). A few millimetres of tolerance stops a
 * standard 2 ft (610 mm) slab being charged as 3 ft.
 */
export const feetUp = (mm: number) => Math.max(1, Math.ceil(mm / MM_PER_FT - 0.02));

export const isPricedCabinet = (p: Product) => p.group === "cabinets" && p.model !== "dishwasher" && p.model !== "hood";

/** Front height used for pricing: the door/drawer face, without legs or plinth. */
export const frontHeight = (p: Product, height: number) => height - p.plinth;

/**
 * Width of front charged: the unit's width, or for an L corner unit the run it covers along both
 * walls (the shared corner counted once).
 */
export const frontWidth = (p: Product, width: number, depth: number) => (p.model === "cornerL" ? width + depth - (p.arm ?? BASE_D) : width);

/** Cabinet price: front area × LKR 7,100 per sq ft. Null for things Pantry LK doesn't price this way. */
export function cabinetPrice(p: Product, width: number, height = p.height, depth = p.depth): number | null {
  if (!isPricedCabinet(p)) return null;
  return Math.round(sqft(frontWidth(p, width, depth), frontHeight(p, height)) * CABINET_RATE_SQFT);
}

export const cabinetArea = (p: Product, width: number, height = p.height, depth = p.depth) => sqft(frontWidth(p, width, depth), frontHeight(p, height));

/** Slab price for one piece of worktop or splashback; each side is rounded up to whole feet. */
export function slabPrice(material: string, lengthMm: number, widthMm: number): { sqft: number; price: number | null } {
  const area = feetUp(lengthMm) * feetUp(widthMm);
  const w = byId(WORKTOPS, material);
  const rate = w.price ?? (w.category === "Granite" ? GRANITE_RATE_SQFT : null);
  return { sqft: area, price: rate != null ? area * rate : null };
}

const lkr = new Intl.NumberFormat("en-LK", { maximumFractionDigits: 0 });
export const formatLKR = (n: number) => `LKR ${lkr.format(n)}`;
