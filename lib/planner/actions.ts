"use client";

import { getProduct, presetOf } from "./catalog";
import { BASE_D } from "./finishes";
import { autoPlace, findCollision, itemDims, itemOnWall, roomWalls, wallPoint, type Wall } from "./geometry";
import { command, getState, LOCK_KEY, newDesign, replaceDesign, setUI, toast, uid, update } from "./store";
import type { Design, Item, Lighting, Opening, RoomShape, TopSpec, Vec2 } from "./types";

const lastPlaced = { wall: -1, u: 0 };

/** When the layout is locked, anything that would move, resize, add or remove units is refused. */
export function blockedByLock() {
  if (!getState().ui.locked) return false;
  toast("Layout is locked. Unlock it (padlock, bottom of the screen) to move or change units.");
  return true;
}

export function setLocked(locked: boolean) {
  setUI({ locked, dragging: false });
  try {
    localStorage.setItem(LOCK_KEY, locked ? "1" : "0");
  } catch {
    /* preference only */
  }
  toast(locked ? "Layout locked: drag anywhere to look around; finishes, tops and lights can still change." : "Layout unlocked.");
}

export function addProduct(productId: string, width?: number) {
  const p = getProduct(productId);
  if (!p || blockedByLock()) return;
  const d = getState().design;
  const w = width ?? p.widths[0];
  const after = lastPlaced.wall >= 0 ? { wall: lastPlaced.wall, u: lastPlaced.u } : undefined;
  const pos = autoPlace(d, p, w, after);
  const item: Item = { id: uid(), product: p.id, width: w, ...pos };
  const bad = findCollision(d, item);
  update((x) => ({ ...x, items: [...x.items, item] }));
  rememberPlacement(item);
  setUI({ sel: { type: "item", id: item.id } });
  if (bad) toast("No free wall space found — drag the item to where you want it.");
}

function rememberPlacement(item: Item) {
  const p = getProduct(item.product);
  if (!p) return;
  const d = getState().design;
  const on = itemOnWall(item, itemDims(item, p, d.room).d, roomWalls(d.room.shape));
  if (on && p.layer !== "fixture") {
    lastPlaced.wall = on.wall;
    lastPlaced.u = on.u1;
  }
}

export const getItem = (id: string) => getState().design.items.find((i) => i.id === id);

export function setItem(id: string, patch: Partial<Item>, history = true) {
  update((d) => ({ ...d, items: d.items.map((i) => (i.id === id ? { ...i, ...patch } : i)) }), history);
}

/** Change a property that alters the footprint; refuse if the result would collide. */
export function setItemChecked(id: string, patch: Partial<Item>) {
  if (blockedByLock()) return false;
  const d = getState().design;
  const it = d.items.find((i) => i.id === id);
  if (!it) return;
  const next = { ...it, ...patch };
  const p = getProduct(next.product)!;
  const walls = roomWalls(d.room.shape);
  // Keep wall-mounted items tight against their wall when the depth or width changes.
  const on = itemOnWall(it, itemDims(it, p, d.room).d, walls);
  if (on && !("x" in patch) && !("rot" in patch)) {
    const w = walls[on.wall];
    const nd = itemDims(next, p, d.room);
    const u0 = Math.max(0, Math.min(w.len - nd.w, on.u0));
    const pos = wallPoint(w, u0 + nd.w / 2, nd.d / 2 + 0.5);
    next.x = pos.x;
    next.z = pos.z;
  }
  const hit = findCollision({ ...d, items: d.items.filter((i) => i.id !== id) }, next, walls);
  if (hit) {
    toast(hit.kind === "outside" ? "That doesn't fit inside the room." : "Not enough space for that change.");
    return false;
  }
  setItem(id, next);
  return true;
}

export function removeSelection() {
  const sel = getState().ui.sel;
  if (!sel || ((sel.type === "item" || sel.type === "opening") && blockedByLock())) return;
  if (sel.type === "item") update((d) => ({ ...d, items: d.items.filter((i) => i.id !== sel.id) }));
  else if (sel.type === "opening") update((d) => ({ ...d, openings: d.openings.filter((o) => o.id !== sel.id) }));
  else return;
  setUI({ sel: null, panel: null });
}

export function duplicateItem(id: string) {
  if (blockedByLock()) return;
  const d = getState().design;
  const it = d.items.find((i) => i.id === id);
  const p = it && getProduct(it.product);
  if (!it || !p) return;
  const walls = roomWalls(d.room.shape);
  const on = itemOnWall(it, itemDims(it, p, d.room).d, walls);
  const pos = autoPlace(d, p, it.width, on ? { wall: on.wall, u: on.u1 } : undefined);
  const copy: Item = { ...it, id: uid(), ...pos, open: false };
  if (p.mount === "free") {
    copy.x = it.x + it.width + 100;
    copy.z = it.z;
    copy.rot = it.rot;
  }
  update((x) => ({ ...x, items: [...x.items, copy] }));
  setUI({ sel: { type: "item", id: copy.id } });
  if (findCollision(getState().design, copy)) toast("Placed where it overlaps — drag it to a free spot.");
}

export function rotateItem(id: string, dir: 1 | -1) {
  const it = getItem(id);
  if (!it || blockedByLock()) return;
  const step = getProduct(it.product)?.mount === "free" ? Math.PI / 4 : Math.PI / 2;
  setItem(id, { rot: Math.round(((it.rot + dir * step) / (Math.PI / 4))) * (Math.PI / 4) });
}

export function replaceProduct(id: string, productId: string) {
  const it = getItem(id);
  const p = getProduct(productId);
  if (!it || !p) return;
  const width = p.widths.reduce((best, w) => (Math.abs(w - it.width) < Math.abs(best - it.width) ? w : best), p.widths[0]);
  if (setItemChecked(id, { product: productId, width, elev: undefined, depth: undefined, height: undefined, open: false })) toast(`Replaced with ${p.name}.`);
}

// ---------------------------------------------------------------- worktops & lighting

/** Change the worktop for the whole kitchen, or only for the base units in one section. */
export function setTops(patch: Partial<TopSpec>, sectionIds?: string[]) {
  update((d) => {
    if (sectionIds) return { ...d, items: d.items.map((i) => (sectionIds.includes(i.id) ? { ...i, top: { ...i.top, ...patch } } : i)) };
    const s = { ...d.style };
    if (patch.material) s.worktop = patch.material;
    if (patch.thickness) s.topThickness = patch.thickness;
    if (patch.edge) s.topEdge = patch.edge;
    if (patch.splash) s.splash = patch.splash;
    return { ...d, style: s };
  });
}

/** Drop section overrides so those units follow the kitchen worktop again. */
export function clearTops(sectionIds?: string[]) {
  update((d) => ({ ...d, items: d.items.map((i) => (i.top && (!sectionIds || sectionIds.includes(i.id)) ? { ...i, top: undefined } : i)) }));
}

export function setLighting(patch: Partial<Lighting>) {
  update((d) => ({ ...d, lighting: { ...d.lighting, ...patch, zones: { ...d.lighting.zones, ...patch.zones } } }));
}

export function toggleOpen(id: string) {
  const it = getItem(id);
  if (it) setItem(id, { open: !it.open }, false);
}

// ---------------------------------------------------------------- openings

export function addOpening(presetId: string) {
  if (blockedByLock()) return;
  const pr = presetOf(presetId);
  const d = getState().design;
  const walls = roomWalls(d.room.shape);
  const sel = getState().ui.sel;
  const preferred = sel?.type === "wall" ? Number(sel.id) : 0;
  const order = [preferred, ...walls.map((w) => w.i).filter((i) => i !== preferred)];
  for (const wi of order) {
    const w = walls[wi];
    if (w.len < pr.width + 100) continue;
    const taken = d.openings.filter((o) => o.wall === wi).map((o) => [o.offset - o.width / 2 - 50, o.offset + o.width / 2 + 50]);
    for (let u = w.len / 2, k = 0; k < 40; k++, u = w.len / 2 + (k % 2 ? 1 : -1) * Math.ceil(k / 2) * 150) {
      const s = u - pr.width / 2, e = u + pr.width / 2;
      if (s < 50 || e > w.len - 50) continue;
      if (taken.some(([a, b]) => e > a && s < b)) continue;
      const o: Opening = { id: uid(), type: pr.type, preset: pr.id, wall: wi, offset: u, width: pr.width, height: pr.height, sill: pr.sill, ...(pr.type === "door" ? { hinge: "l" as const } : {}) };
      update((x) => ({ ...x, openings: [...x.openings, o] }));
      setUI({ sel: { type: "opening", id: o.id } });
      return;
    }
  }
  toast("No wall has enough free space for that opening.");
}

export function setOpening(id: string, patch: Partial<Opening>, history = true) {
  if (history && blockedByLock()) return;
  update((d) => ({ ...d, openings: d.openings.map((o) => (o.id === id ? clampOpening({ ...o, ...patch }, d) : o)) }), history);
}

export function clampOpening(o: Opening, d: Design): Opening {
  const walls = roomWalls(d.room.shape);
  const w = walls[o.wall] ?? walls[0];
  const width = Math.min(o.width, w.len - 20);
  const height = Math.min(o.height, d.room.ceiling - o.sill);
  const offset = Math.min(w.len - width / 2 - 10, Math.max(width / 2 + 10, o.offset));
  return { ...o, wall: w.i, width, height, offset };
}

// ---------------------------------------------------------------- room

/** The wall in the new shape that faces the same way and lies closest to a point on an old wall. */
function matchWall(walls: Wall[], from: Wall, pt: Vec2) {
  let best: Wall | null = null, bestD = Infinity;
  for (const w of walls) {
    if (w.n.x * from.n.x + w.n.z * from.n.z < 0.99) continue;
    const u = (pt.x - w.a.x) * w.dir.x + (pt.z - w.a.z) * w.dir.z;
    const off = Math.abs((pt.x - w.a.x) * w.n.x + (pt.z - w.a.z) * w.n.z);
    const d = off + Math.max(0, -u, u - w.len);
    if (d < bestD) { bestD = d; best = w; }
  }
  return best;
}

/** Resize or reshape the room; openings and wall units follow the wall they're on. */
export function setRoomShape(shape: RoomShape) {
  if (blockedByLock()) return;
  update((d) => {
    const oldWalls = roomWalls(d.room.shape);
    const walls = roomWalls(shape);
    const next: Design = { ...d, room: { ...d.room, shape } };
    const openings = d.openings.flatMap((o) => {
      const ow = oldWalls[o.wall];
      const w = ow && matchWall(walls, ow, wallPoint(ow, o.offset));
      if (!w || w.len < o.width + 20) return [];
      const c = wallPoint(ow, o.offset);
      return [clampOpening({ ...o, wall: w.i, offset: (c.x - w.a.x) * w.dir.x + (c.z - w.a.z) * w.dir.z }, next)];
    });
    const items = d.items.map((it) => {
      const p = getProduct(it.product);
      if (!p) return it;
      const dm = itemDims(it, p, d.room);
      const on = itemOnWall(it, dm.d, oldWalls);
      if (!on) return it;
      const ow = oldWalls[on.wall];
      const back = wallPoint(ow, (on.u0 + on.u1) / 2);
      const w = matchWall(walls, ow, back);
      if (!w) return it;
      const u = Math.min(w.len - dm.w / 2, Math.max(dm.w / 2, (back.x - w.a.x) * w.dir.x + (back.z - w.a.z) * w.dir.z));
      const pos = wallPoint(w, u, dm.d / 2 + 0.5);
      return { ...it, x: pos.x, z: pos.z, rot: w.rot };
    });
    return { ...next, openings, items };
  });
}

export function setCeiling(h: number) {
  if (blockedByLock()) return;
  update((d) => ({ ...d, room: { ...d.room, ceiling: h }, openings: d.openings.map((o) => ({ ...o, height: Math.min(o.height, h - o.sill) })) }));
}

// ---------------------------------------------------------------- templates

export type Template = "empty" | "straight" | "l" | "u" | "galley" | "island";

export function startDesign(shape: RoomShape, template: Template) {
  const d = newDesign(shape);
  const walls = roomWalls(shape);
  const n = walls.length;
  // Wall roles for every supported shape: back = 0, then right, front and left going clockwise.
  const role = { back: 0, right: n - 3, front: n - 2, left: n - 1 };
  const CORNER = 900;

  const place = (wall: number, u0: number, pid: string, width: number, rot?: number) => {
    const w = walls[wall];
    const p = getProduct(pid)!;
    const probe: Item = { id: uid(), product: pid, width, x: 0, z: 0, rot: w.rot };
    const dm = itemDims(probe, p, d.room);
    if (u0 < -0.5 || u0 + width > w.len + 0.5) return null;
    const pos = wallPoint(w, u0 + width / 2, dm.d / 2 + 0.5);
    const it: Item = { ...probe, x: pos.x, z: pos.z, rot: rot ?? w.rot, ...(p.model === "cornerL" ? { mirror: u0 + width / 2 > w.len / 2 } : {}) };
    if (findCollision(d, it, walls)) return null;
    d.items.push(it);
    return it;
  };
  const fill = (wall: number, u: number, list: [string, number][]) => {
    for (const [pid, w] of list) if (place(wall, u, pid, w)) u += w;
    return u;
  };
  const fillBack = (wall: number, u: number, list: [string, number][]) => {
    for (const [pid, w] of list) if (place(wall, u - w, pid, w)) u -= w;
    return u;
  };
  /** Close a gap with the largest standard door units that fit (anything under 200 mm is a filler). */
  const fillGap = (wall: number, u0: number, u1: number, pid = "base-door") => {
    for (const w of [800, 600, 400, 200]) while (u1 - u0 >= w && place(wall, u0, pid, w)) u0 += w;
  };
  const corner = (wall: number, at: "start" | "end") => place(wall, at === "start" ? 0 : walls[wall].len - CORNER, "base-corner-l", CORNER);
  /** Wall cabinets above every base unit (skipped where a window is), a hood above each hob, a corner unit above each corner. */
  const topUp = () => {
    // Corners first (they fix where both walls start), then hoods over the hobs, then everything else.
    const rank = (it: Item) => ({ cornerL: 0, hob: 1, hobOven: 1 } as Record<string, number>)[getProduct(it.product)!.model] ?? 2;
    for (const it of [...d.items].sort((a, b) => rank(a) - rank(b))) {
      const p = getProduct(it.product)!;
      if (p.layer !== "base") continue;
      const on = itemOnWall(it, p.depth, walls);
      if (!on) continue;
      if (p.model === "hob" || p.model === "hobOven") {
        const hw = it.width >= 900 ? 900 : 600;
        place(on.wall, on.u0 + (it.width - hw) / 2, "hood-chimney", hw);
      } else if (p.model === "cornerL") place(on.wall, on.u0, "wall-corner-l", CORNER);
      else if (getProduct("wall-door")!.widths.includes(it.width)) place(on.wall, on.u0, "wall-door", it.width);
    }
  };

  if (template !== "empty") {
    const win = d.openings.find((o) => o.type === "window" && o.wall === role.back);
    const back = walls[role.back];
    const sinkU = Math.round((win ? win.offset : back.len / 2) - 400);
    const corners = template === "l" || template === "island" ? ["end"] : template === "u" ? ["start", "end"] : [];
    for (const c of corners) corner(role.back, c as "start" | "end");
    const startU = corners.includes("start") ? CORNER : 0;
    const endU = corners.includes("end") ? back.len - CORNER : back.len;

    const left = fillBack(role.back, sinkU, [["base-dishwasher", 600], ["base-drawers-3", 600], ["base-door", 400]]);
    fillGap(role.back, startU, left);
    const right = fill(role.back, sinkU, template === "straight" || template === "galley"
      ? [["base-sink", 800], ["base-drawers-2", 600], ["base-hob", 800]]
      : [["base-sink", 800], ["base-drawers-2", 600]]);
    if (template === "straight" && endU - right >= 600) fillBack(role.back, endU, [["tall-fridge", 600]]);
    fillGap(role.back, right, endU);

    if (template === "l" || template === "u" || template === "island") {
      const r = walls[role.right];
      const u = fill(role.right, CORNER, [["base-hob", 800], ["base-drawers-3", 600]]);
      const fridge = r.len - u >= 600 ? fillBack(role.right, r.len, [["tall-fridge", 600]]) : r.len;
      fillGap(role.right, u, fridge);
    }
    if (template === "u") {
      const l = walls[role.left];
      const u = fillBack(role.left, l.len - CORNER, [["base-drawers-2", 800], ["base-door", 600]]);
      fillGap(role.left, Math.max(0, u - 1200), u);
    }
    if (template === "galley") {
      const f = walls[role.front];
      fill(role.front, 0, [["tall-fridge", 600], ["tall-oven", 600], ["base-drawers-3", 600], ["base-door", 600]].filter((_, k) => k < Math.floor((f.len - 1400) / 600)) as [string, number][]);
    }
    if (template === "island") {
      const b = walls[role.back];
      const cx = b.a.x + b.len / 2;
      const z = BASE_D + 1100 + BASE_D / 2;
      [["base-drawers-3", 600], ["base-door", 600], ["base-drawers-3", 600]].forEach(([pid, w], k) => {
        const it: Item = { id: uid(), product: pid as string, width: w as number, x: cx - 600 + k * 600, z, rot: Math.PI };
        if (!findCollision(d, it, walls)) d.items.push(it);
      });
      for (let k = 0; k < 3; k++) d.items.push({ id: uid(), product: "stool", width: 400, x: cx - 600 + k * 600, z: z + BASE_D / 2 + 320, rot: Math.PI });
    }
    topUp();
  }
  replaceDesign(d);
  lastPlaced.wall = -1;
  setUI({ dialog: null, step: template === "empty" ? 1 : 2, view: template === "empty" ? "plan" : "3d" });
  command("reset");
}
