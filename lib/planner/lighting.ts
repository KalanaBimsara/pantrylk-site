import { getProduct } from "./catalog";
import { byId, LIGHT_COLORS, LIGHT_ZONES } from "./finishes";
import { axes, isCabinetModel, itemBoxes, itemDims } from "./geometry";
import type { Design, Item, LightZone, Product } from "./types";

export const DEFAULT_LIGHTING: Design["lighting"] = {
  mode: "day",
  color: "warm",
  brightness: 1,
  zones: { under: true, plinth: false, glass: true, cove: false, shelf: false },
};

export type Strip = {
  key: string;
  itemId: string;
  zone: LightZone | "custom";
  /** Centre in mm. */
  x: number; y: number; z: number;
  rot: number;
  len: number;
  /** Width of the glowing area across the strip. */
  span: number;
  facing: "down" | "up";
};

/** Which zone an item's built-in strip belongs to, if any. */
export function zonesFor(p: Product): (LightZone | "custom")[] {
  if (p.model === "ledStrip") return ["custom"];
  if (p.model === "shelf") return ["shelf"];
  if (!isCabinetModel(p)) return [];
  if (p.layer === "wall") return p.model === "glass" ? ["under", "glass", "cove"] : ["under", "cove"];
  if (p.plinth > 0) return ["plinth"];
  return [];
}

type LitDesign = Pick<Design, "items" | "room" | "lighting">;

const stripOn = (it: Item, zone: LightZone | "custom", d: LitDesign) =>
  it.light === "on" ? true : it.light === "off" ? false : zone === "custom" ? true : d.lighting.zones[zone];

export function ledStrips(d: LitDesign): Strip[] {
  const out: Strip[] = [];
  for (const it of d.items) {
    const p = getProduct(it.product);
    if (!p) continue;
    const dm = itemDims(it, p, d.room);
    // Each lit face: an L corner unit has two arms, and only the part of each arm not hidden by the other shows.
    const faces = p.model === "cornerL"
      ? itemBoxes(it, p, dm).map((b, k) => ({ ...b, off: (k === 0) === !it.mirror ? (p.arm ?? 0) / 2 : -(p.arm ?? 0) / 2, w: b.w - (p.arm ?? 0) }))
      : [{ x: it.x, z: it.z, rot: it.rot, w: dm.w, d: dm.d, off: 0 }];
    faces.forEach((f, k) => {
      const { ax, az } = axes(f.rot);
      const at = (zone: LightZone | "custom", lx: number, ly: number, lz: number, len: number, span: number, facing: Strip["facing"]) => {
        if (!stripOn(it, zone, d) || len < 50) return;
        lx += f.off;
        out.push({ key: `${it.id}:${zone}:${k}`, itemId: it.id, zone, x: f.x + ax.x * lx + az.x * lz, y: dm.y0 + ly, z: f.z + ax.z * lx + az.z * lz, rot: f.rot, len, span, facing });
      };
      for (const zone of zonesFor(p)) {
        if (zone === "under") at(zone, 0, -5, f.d / 2 - 60, f.w - 40, 40, "down");
        if (zone === "cove") at(zone, 0, dm.h + 5, -f.d / 2 + 70, f.w - 40, 40, "up");
        if (zone === "glass") at(zone, 0, dm.h - 30, 0, f.w - 60, f.d * 0.5, "down");
        if (zone === "plinth") at(zone, 0, 6, f.d / 2 - 66, f.w - 10, 24, "down");
        if (zone === "shelf") at(zone, 0, -4, 0, f.w - 40, 40, "down");
        if (zone === "custom") at(zone, 0, 0, 0, f.w, 30, "down");
      }
    });
  }
  return out;
}

export type PointLight = { key: string; x: number; y: number; z: number; kind: "pendant" | "downlight" };

export function pointLights(d: LitDesign): PointLight[] {
  const out: PointLight[] = [];
  for (const it of d.items) {
    const p = getProduct(it.product);
    if (!p || (p.model !== "pendant" && p.model !== "downlight") || it.light === "off") continue;
    const dm = itemDims(it, p, d.room);
    out.push({ key: it.id, x: it.x, y: dm.y0 + (p.model === "pendant" ? dm.h * 0.28 : 0), z: it.z, kind: p.model });
  }
  return out;
}

export const lightHex = (d: Pick<Design, "lighting">) => byId(LIGHT_COLORS, d.lighting.color).hex;

/** Metres of strip per zone, for the item list and quotation. */
export function stripTotals(d: LitDesign) {
  const totals = new Map<string, number>();
  for (const s of ledStrips(d)) totals.set(s.zone, (totals.get(s.zone) ?? 0) + s.len);
  return [...totals.entries()].map(([zone, mm]) => ({
    zone,
    name: zone === "custom" ? "LED strip lights" : `LED strip, ${LIGHT_ZONES.find((z) => z.id === zone)!.name.toLowerCase()}`,
    metres: Math.round(mm / 100) / 10,
  }));
}
