import { getProduct, itemCode } from "./catalog";
import { byId, FRONTS, HANDLES, LED_PRICE_PER_M, LIGHT_COLORS, LIGHT_ZONES, SPLASHES, TOP_EDGES, WORKTOPS } from "./finishes";
import {
  cutLength, findCollision, footprint, isCabinetModel, itemDims, itemOnWall, polysOverlap, roomArea, roomWalls, splashPieces, wallPoint, worktopRuns,
} from "./geometry";
import { stripTotals } from "./lighting";
import { cabinetArea, cabinetPrice, formatLKR, isPricedCabinet, slabPrice } from "./pricing";
import type { Design, Item, TopSpec } from "./types";

export type Finding = { level: "error" | "warning" | "tip"; text: string; itemId?: string };

export function reviewDesign(d: Design): Finding[] {
  const out: Finding[] = [];
  const walls = roomWalls(d.room.shape);
  const name = (it: Item) => getProduct(it.product)?.name ?? "Item";
  const seen = new Set<string>();

  for (const it of d.items) {
    const hit = findCollision(d, it, walls);
    if (!hit) continue;
    if (hit.kind === "item") {
      const key = [it.id, hit.id].sort().join();
      if (seen.has(key)) continue;
      seen.add(key);
      const other = d.items.find((o) => o.id === hit.id);
      out.push({ level: "error", text: `${name(it)} overlaps ${other ? name(other).toLowerCase() : "another item"}.`, itemId: it.id });
    } else if (hit.kind === "opening") {
      const o = d.openings.find((x) => x.id === hit.id);
      out.push({ level: "error", text: `${name(it)} blocks a ${o?.type === "window" ? "window" : o?.type === "door" ? "door" : "wall opening"}.`, itemId: it.id });
    } else out.push({ level: "error", text: `${name(it)} is outside the room or taller than the ceiling.`, itemId: it.id });
  }

  // Keep the area in front of each door clear so it can open.
  for (const o of d.openings.filter((x) => x.type === "door")) {
    const w = walls[o.wall];
    if (!w) continue;
    const s = o.offset - o.width / 2, e = o.offset + o.width / 2;
    const swing = [wallPoint(w, s), wallPoint(w, e), wallPoint(w, e, Math.min(o.width, 900)), wallPoint(w, s, Math.min(o.width, 900))];
    for (const it of d.items) {
      const p = getProduct(it.product);
      if (!p || p.layer === "wall" || p.layer === "fixture" || p.hang) continue;
      const dm = itemDims(it, p, d.room);
      if (polysOverlap(swing, footprint(it, it.rot, dm.w, dm.d), 5)) out.push({ level: "warning", text: `${name(it)} is in the way of a door swing.`, itemId: it.id });
    }
  }

  const hobs = d.items.filter((it) => ["hob", "hobOven", "range"].includes(getProduct(it.product)?.model ?? ""));
  for (const h of hobs) {
    const p = getProduct(h.product)!;
    const on = itemOnWall(h, p.depth, walls);
    if (!on) continue;
    const win = d.openings.find((o) => o.wall === on.wall && o.type === "window" && o.offset + o.width / 2 > on.u0 && o.offset - o.width / 2 < on.u1);
    if (win) out.push({ level: "warning", text: "A cooktop sits under a window — curtains and draughts near a flame are a risk.", itemId: h.id });
    const hood = d.items.some((it) => {
      const hp = getProduct(it.product);
      if (hp?.model !== "hood") return false;
      const ho = itemOnWall(it, hp.depth, walls);
      return ho && ho.wall === on.wall && ho.u0 < on.u1 && ho.u1 > on.u0;
    });
    if (!hood && !win) out.push({ level: "tip", text: "Add an extractor hood above the cooktop to keep the kitchen fresh.", itemId: h.id });
    const tallNext = d.items.some((it) => {
      const tp = getProduct(it.product);
      if (!tp || (tp.layer !== "tall" && tp.model !== "fridge" && tp.model !== "fridgeDouble")) return false;
      const to = itemOnWall(it, tp.depth, walls);
      return to && to.wall === on.wall && (Math.abs(to.u1 - on.u0) < 300 || Math.abs(to.u0 - on.u1) < 300);
    });
    if (tallNext) out.push({ level: "warning", text: "Leave at least 300 mm of worktop between the cooktop and a tall unit.", itemId: h.id });
  }

  const has = (m: string[]) => d.items.some((it) => m.includes(getProduct(it.product)?.model ?? ""));
  if (d.items.some((it) => getProduct(it.product)?.group === "cabinets")) {
    if (!has(["sink"])) out.push({ level: "tip", text: "No sink cabinet yet — add one from Base cabinets › For sink." });
    if (!has(["hob", "hobOven", "range"])) out.push({ level: "tip", text: "No cooktop yet — add one from Base cabinets › For cooktop." });
    if (!has(["fridge", "fridgeDouble", "tallFridge"])) out.push({ level: "tip", text: "No fridge yet — add one from Appliances or High cabinets." });
  } else out.push({ level: "tip", text: "Your room is ready — add cabinets in “Make it yours”." });
  if (!d.lighting.zones.under && d.items.some((it) => getProduct(it.product)?.layer === "wall" && isCabinetModel(getProduct(it.product)!)))
    out.push({ level: "tip", text: "Under-cabinet LED strips make the worktop much easier to work on — switch them on in Lights." });
  return out;
}

export type Line = { key: string; productId: string; name: string; code: string; detail: string; qty: number; price: number | null };

export function partsList(d: Design): Line[] {
  const map = new Map<string, Line>();
  for (const it of d.items) {
    const p = getProduct(it.product);
    if (!p) continue;
    const dm = itemDims(it, p, d.room);
    const finish = p.group === "cabinets" && p.model !== "hood" ? `${byId(FRONTS, it.front ?? d.style.front).name}, ${byId(HANDLES, it.handle ?? d.style.handle).name.toLowerCase()}` : "";
    const size = p.resizable || p.model === "cornerL" ? `${dm.w}×${dm.d}×${dm.h - p.plinth} mm` : isPricedCabinet(p) ? `${dm.w}×${dm.h - p.plinth}×${dm.d} mm` : `${dm.w / 10} cm`;
    const key = `${p.id}|${size}|${finish}`;
    const unit = cabinetPrice(p, dm.w, dm.h, dm.d) ?? (p.price != null ? Math.round((p.price * it.width) / p.widths[0]) : null);
    const area = isPricedCabinet(p) ? `${cabinetArea(p, dm.w, dm.h, dm.d).toFixed(2)} sq ft` : "";
    const line = map.get(key);
    if (line) {
      line.qty++;
    } else map.set(key, { key, productId: p.id, name: p.name, code: itemCode(p, dm.w), detail: [size, area, finish].filter(Boolean).join(" · "), qty: 1, price: unit });
  }
  const lines = [...map.values()].sort((a, b) => a.code.localeCompare(b.code));

  // Worktops: one line per distinct top. Every slab piece (each section and splashback piece) is
  // measured in whole feet, rounded up, the way stone is cut and sold.
  const tops = new Map<string, { spec: TopSpec; len: number; sqft: number; splashSqft: number; price: number | null }>();
  const runs = worktopRuns(d);
  for (const r of runs) {
    const k = `${r.spec.material}|${r.spec.thickness}|${r.spec.edge}|${r.spec.splash}`;
    const t = tops.get(k) ?? { spec: r.spec, len: 0, sqft: 0, splashSqft: 0, price: 0 };
    const slab = slabPrice(r.spec.material, cutLength(r, runs), r.depth);
    const splash = splashPieces(d, r).map((s) => slabPrice(r.spec.material, s.b - s.a, s.h));
    t.len += r.len;
    t.sqft += slab.sqft;
    t.splashSqft += splash.reduce((s, x) => s + x.sqft, 0);
    t.price = slab.price == null || t.price == null ? null : t.price + slab.price + splash.reduce((s, x) => s + (x.price ?? 0), 0);
    tops.set(k, t);
  }
  for (const [k, t] of tops) {
    const w = byId(WORKTOPS, t.spec.material);
    const splash = t.splashSqft > 0 ? ` + ${SPLASHES.find((s) => s.id === t.spec.splash)!.name.toLowerCase()} ${t.splashSqft} sq ft` : "";
    lines.push({
      key: `top|${k}`, productId: "", name: `Pantry top, ${w.name}`, code: "TOP", qty: 1,
      detail: `${t.spec.thickness} mm, ${TOP_EDGES.find((e) => e.id === t.spec.edge)!.name.toLowerCase()} edge · ${(t.len / 1000).toFixed(2)} m run, ${t.sqft} sq ft${splash}`,
      price: t.price,
    });
  }

  // Built-in LED strips by zone (stand-alone LED strip items are already listed above).
  const color = byId(LIGHT_COLORS, d.lighting.color);
  for (const t of stripTotals(d).filter((x) => x.zone !== "custom"))
    lines.push({
      key: `led|${t.zone}`, productId: "", name: t.name.replace(/^LED strip, /, "LED strip — "), code: "LED", qty: 1,
      detail: `${t.metres} m · ${color.name}${color.sub === "RGB" ? " (RGB)" : ` ${color.sub}`}`,
      price: LED_PRICE_PER_M != null ? Math.round(LED_PRICE_PER_M * t.metres) : null,
    });
  return lines;
}

/** Total of everything with a price; `unpriced` counts lines quoted separately (appliances, other tops, lights…). */
export function estimate(lines: Line[]): { total: number; unpriced: number } | null {
  const priced = lines.filter((l) => l.price != null);
  if (!priced.length) return null;
  return { total: priced.reduce((s, l) => s + (l.price ?? 0) * l.qty, 0), unpriced: lines.length - priced.length };
}

export function designSummary(d: Design, link?: string) {
  const s = d.room.shape;
  const lines = partsList(d);
  const zones = LIGHT_ZONES.filter((z) => d.lighting.zones[z.id]).map((z) => z.name.toLowerCase());
  const est = estimate(lines);
  const color = byId(LIGHT_COLORS, d.lighting.color);
  return [
    `Hi Pantry LK, I've designed my kitchen in your Kitchen Planner: "${d.name}".`,
    ``,
    `Room: ${s.width / 1000} m × ${s.depth / 1000} m (${roomArea(s).toFixed(1)} m²), ceiling ${d.room.ceiling / 1000} m`,
    `Fronts: ${byId(FRONTS, d.style.front).name} · Handles: ${byId(HANDLES, d.style.handle).name}`,
    `Lighting: ${zones.length ? `${color.name} LED strips — ${zones.join(", ")}` : "no LED strips"}`,
    ``,
    ...lines.map((l) => `• ${l.qty} × ${l.name} (${l.detail})${l.price != null ? ` — ${formatLKR(l.price * l.qty)}` : ""}`),
    ...(est ? [``, `Estimated total: ${formatLKR(est.total)}${est.unpriced ? ` (+ ${est.unpriced} item${est.unpriced === 1 ? "" : "s"} to be quoted)` : ""}`] : []),
    ...(d.notes.trim() ? [``, `Notes: ${d.notes.trim()}`] : []),
    ...(link ? [``, `Open my design: ${link}`] : []),
  ].join("\n");
}
