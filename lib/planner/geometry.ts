import { getProduct } from "./catalog";
import { TOP_D, WALL_T } from "./finishes";
import type { Design, Item, Opening, Product, Room, RoomShape, Vec2 } from "./types";

const add = (a: Vec2, b: Vec2): Vec2 => ({ x: a.x + b.x, z: a.z + b.z });
const sub = (a: Vec2, b: Vec2): Vec2 => ({ x: a.x - b.x, z: a.z - b.z });
const mul = (a: Vec2, k: number): Vec2 => ({ x: a.x * k, z: a.z * k });
const dot = (a: Vec2, b: Vec2) => a.x * b.x + a.z * b.z;
const cross = (a: Vec2, b: Vec2) => a.x * b.z - a.z * b.x;

export function roomPolygon(s: RoomShape): Vec2[] {
  const { width: W, depth: D } = s;
  if (s.kind === "notch") {
    const cw = Math.min(s.cutWidth, W - 600);
    const cd = Math.min(s.cutDepth, D - 600);
    return [{ x: 0, z: 0 }, { x: W - cw, z: 0 }, { x: W - cw, z: cd }, { x: W, z: cd }, { x: W, z: D }, { x: 0, z: D }];
  }
  if (s.kind === "angled") {
    const c = Math.min(s.chamfer, W - 600, D - 600);
    return [{ x: 0, z: 0 }, { x: W - c, z: 0 }, { x: W, z: c }, { x: W, z: D }, { x: 0, z: D }];
  }
  return [{ x: 0, z: 0 }, { x: W, z: 0 }, { x: W, z: D }, { x: 0, z: D }];
}

function signedArea(p: Vec2[]) {
  let a = 0;
  for (let i = 0; i < p.length; i++) a += cross(p[i], p[(i + 1) % p.length]);
  return a / 2;
}

export type Wall = { i: number; a: Vec2; b: Vec2; len: number; dir: Vec2; n: Vec2; rot: number };

export function roomWalls(s: RoomShape): Wall[] {
  const p = roomPolygon(s);
  const sign = Math.sign(signedArea(p)) || 1;
  return p.map((a, i) => {
    const b = p[(i + 1) % p.length];
    const d = sub(b, a);
    const len = Math.hypot(d.x, d.z);
    const dir = mul(d, 1 / len);
    const n = mul({ x: -dir.z, z: dir.x }, sign);
    return { i, a, b, len, dir, n, rot: Math.atan2(n.x, n.z) };
  });
}

/** Outer corners of the wall band, mitred so walls of any angle meet cleanly. */
export function outerCorners(walls: Wall[]): Vec2[] {
  return walls.map((w, i) => {
    const prev = walls[(i - 1 + walls.length) % walls.length];
    const p = sub(prev.a, mul(prev.n, WALL_T));
    const q = sub(w.a, mul(w.n, WALL_T));
    const den = cross(prev.dir, w.dir);
    if (Math.abs(den) < 1e-9) return q;
    const t = cross(sub(q, p), w.dir) / den;
    return add(p, mul(prev.dir, t));
  });
}

export const wallPoint = (w: Wall, u: number, inset = 0): Vec2 => add(add(w.a, mul(w.dir, u)), mul(w.n, inset));

export type WallPiece = { poly: Vec2[]; y0: number; y1: number };

export function wallPieces(w: Wall, outer: Vec2[], count: number, openings: Opening[], ceiling: number): WallPiece[] {
  const oStart = outer[w.i];
  const oEnd = outer[(w.i + 1) % count];
  const quad = (us: number, ue: number) => {
    const is = wallPoint(w, us);
    const ie = wallPoint(w, ue);
    const os = us <= 0.5 ? oStart : sub(is, mul(w.n, WALL_T));
    const oe = ue >= w.len - 0.5 ? oEnd : sub(ie, mul(w.n, WALL_T));
    return [is, ie, oe, os];
  };
  const pieces: WallPiece[] = [];
  const ops = openings.filter((o) => o.wall === w.i).sort((a, b) => a.offset - b.offset);
  let cursor = 0;
  for (const o of ops) {
    const s = Math.max(cursor, o.offset - o.width / 2);
    const e = Math.min(w.len, o.offset + o.width / 2);
    if (e <= s) continue;
    if (s > cursor + 0.5) pieces.push({ poly: quad(cursor, s), y0: 0, y1: ceiling });
    if (o.sill > 0) pieces.push({ poly: quad(s, e), y0: 0, y1: o.sill });
    if (o.sill + o.height < ceiling) pieces.push({ poly: quad(s, e), y0: o.sill + o.height, y1: ceiling });
    cursor = e;
  }
  if (cursor < w.len - 0.5) pieces.push({ poly: quad(cursor, w.len), y0: 0, y1: ceiling });
  return pieces;
}

export function bounds(p: Vec2[]) {
  const xs = p.map((v) => v.x);
  const zs = p.map((v) => v.z);
  const minX = Math.min(...xs), maxX = Math.max(...xs), minZ = Math.min(...zs), maxZ = Math.max(...zs);
  return { minX, maxX, minZ, maxZ, w: maxX - minX, d: maxZ - minZ, cx: (minX + maxX) / 2, cz: (minZ + maxZ) / 2 };
}

export function roomArea(s: RoomShape) {
  return Math.abs(signedArea(roomPolygon(s))) / 1e6;
}

export function pointInPolygon(pt: Vec2, poly: Vec2[], tol = 1) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i], b = poly[j];
    if (a.z > pt.z !== b.z > pt.z && pt.x < ((b.x - a.x) * (pt.z - a.z)) / (b.z - a.z) + a.x) inside = !inside;
  }
  if (inside) return true;
  // Points lying on the boundary count as inside.
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i], b = poly[(i + 1) % poly.length];
    const ab = sub(b, a);
    const t = Math.max(0, Math.min(1, dot(sub(pt, a), ab) / dot(ab, ab)));
    const c = add(a, mul(ab, t));
    if (Math.hypot(pt.x - c.x, pt.z - c.z) <= tol) return true;
  }
  return false;
}

// ---------------------------------------------------------------- items

export type Dims = { w: number; d: number; h: number; y0: number };

export function itemDims(item: Item, p: Product, room: Room): Dims {
  const w = item.width;
  const d = p.model === "roundTable" ? w : p.resizable ? item.depth ?? p.depth : p.depth;
  let h = p.resizable ? item.height ?? (p.fullHeight ? room.ceiling : p.height) : p.height;
  if (p.fullHeight && item.height == null) h = room.ceiling;
  const y0 = item.elev ?? (p.hang ? room.ceiling - p.hang : p.elev);
  return { w, d, h, y0 };
}

export const axes = (rot: number) => ({ ax: { x: Math.cos(rot), z: -Math.sin(rot) }, az: { x: Math.sin(rot), z: Math.cos(rot) } });

export function footprint(c: Vec2, rot: number, w: number, d: number): Vec2[] {
  const { ax, az } = axes(rot);
  const hx = mul(ax, w / 2), hz = mul(az, d / 2);
  return [sub(sub(c, hx), hz), sub(add(c, hx), hz), add(add(c, hx), hz), add(sub(c, hx), hz)];
}

function project(poly: Vec2[], axis: Vec2) {
  let min = Infinity, max = -Infinity;
  for (const p of poly) {
    const v = dot(p, axis);
    if (v < min) min = v;
    if (v > max) max = v;
  }
  return [min, max] as const;
}

/** Separating-axis test for two convex polygons; overlaps smaller than eps are ignored. */
export function polysOverlap(a: Vec2[], b: Vec2[], eps = 1) {
  for (const poly of [a, b]) {
    for (let i = 0; i < poly.length; i++) {
      const e = sub(poly[(i + 1) % poly.length], poly[i]);
      const len = Math.hypot(e.x, e.z);
      if (len < 1e-9) continue;
      const axis = { x: -e.z / len, z: e.x / len };
      const [a0, a1] = project(a, axis);
      const [b0, b1] = project(b, axis);
      if (Math.min(a1, b1) - Math.max(a0, b0) <= eps) return false;
    }
  }
  return true;
}

const angleDiff = (a: number, b: number) => Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b)));

export function itemOnWall(item: Item, d: number, walls: Wall[]) {
  for (const w of walls) {
    if (angleDiff(item.rot, w.rot) > 0.01) continue;
    const rel = sub(item, w.a);
    if (Math.abs(dot(rel, w.n) - d / 2) > 3) continue;
    const u = dot(rel, w.dir);
    if (u < -1 || u > w.len + 1) continue;
    return { wall: w.i, u0: u - item.width / 2, u1: u + item.width / 2 };
  }
  return null;
}

export type Collision = { kind: "item"; id: string } | { kind: "opening"; id: string } | { kind: "outside" } | null;

export function findCollision(design: Design, item: Item, walls?: Wall[]): Collision {
  const p = getProduct(item.product);
  if (!p) return null;
  const room = design.room;
  const dm = itemDims(item, p, room);
  const fp = footprint(item, item.rot, dm.w, dm.d);
  const poly = roomPolygon(room.shape);
  if (!fp.every((c) => pointInPolygon(c, poly, 2))) return { kind: "outside" };
  if (poly.some((v) => pointInPolygon(v, footprint(item, item.rot, dm.w - 4, dm.d - 4), 0))) return { kind: "outside" };
  if (dm.y0 + dm.h > room.ceiling + 1) return { kind: "outside" };
  if (p.solid === false) return null;

  for (const o of design.items) {
    if (o.id === item.id) continue;
    const op = getProduct(o.product);
    if (!op || op.solid === false) continue;
    const od = itemDims(o, op, room);
    if (Math.min(dm.y0 + dm.h, od.y0 + od.h) - Math.max(dm.y0, od.y0) <= 1) continue;
    if (polysOverlap(fp, footprint(o, o.rot, od.w, od.d))) return { kind: "item", id: o.id };
  }
  const ws = walls ?? roomWalls(room.shape);
  for (const o of design.openings) {
    const w = ws[o.wall];
    if (!w) continue;
    if (Math.min(dm.y0 + dm.h, o.sill + o.height) - Math.max(dm.y0, o.sill) <= 1) continue;
    const s = o.offset - o.width / 2, e = o.offset + o.width / 2;
    const box = [wallPoint(w, s), wallPoint(w, e), wallPoint(w, e, 40), wallPoint(w, s, 40)];
    if (polysOverlap(fp, box)) return { kind: "opening", id: o.id };
  }
  return null;
}

/** Snap a dragged item to the nearest wall and to neighbouring edges. */
export function snapItem(design: Design, item: Item, desired: Vec2, walls: Wall[]): Pick<Item, "x" | "z" | "rot"> {
  const p = getProduct(item.product)!;
  const dm = itemDims(item, p, design.room);
  const b = bounds(roomPolygon(design.room.shape));
  const clampFree = () => ({ x: Math.min(b.maxX, Math.max(b.minX, desired.x)), z: Math.min(b.maxZ, Math.max(b.minZ, desired.z)), rot: item.rot });
  if (p.mount === "free") return clampFree();

  let best: { w: Wall; u: number; score: number } | null = null;
  for (const w of walls) {
    const rel = sub(desired, w.a);
    const u = dot(rel, w.dir);
    const dist = dot(rel, w.n);
    if (u < -dm.w / 2 || u > w.len + dm.w / 2 || dist < -WALL_T * 2 || dist > dm.d / 2 + 450) continue;
    const score = Math.abs(dist - dm.d / 2);
    if (!best || score < best.score) best = { w, u, score };
  }
  if (!best) return clampFree();

  const { w } = best;
  const clampU = (u: number) => (w.len <= dm.w ? w.len / 2 : Math.min(w.len - dm.w / 2, Math.max(dm.w / 2, u)));
  let u = clampU(best.u);
  const edges: number[] = [0, w.len];
  for (const o of design.items) {
    if (o.id === item.id) continue;
    const op = getProduct(o.product);
    if (!op) continue;
    const on = itemOnWall(o, itemDims(o, op, design.room).d, [w]);
    if (on) edges.push(on.u0, on.u1);
  }
  for (const o of design.openings) if (o.wall === w.i) edges.push(o.offset - o.width / 2, o.offset + o.width / 2);
  let shift = 0, bestD = 60;
  for (const e of edges)
    for (const mine of [u - dm.w / 2, u + dm.w / 2]) {
      const dlt = e - mine;
      if (Math.abs(dlt) < bestD) { bestD = Math.abs(dlt); shift = dlt; }
    }
  u = clampU(u + shift);
  const pos = wallPoint(w, u, dm.d / 2 + 0.5);
  return { x: pos.x, z: pos.z, rot: w.rot };
}

/** Find the first free spot for a new item, the way the planner fills walls left to right. */
export function autoPlace(design: Design, product: Product, width: number, after?: { wall: number; u: number }): Pick<Item, "x" | "z" | "rot"> {
  const walls = roomWalls(design.room.shape);
  const probe: Item = { id: "__probe", product: product.id, x: 0, z: 0, rot: 0, width };
  const dm = itemDims(probe, product, design.room);
  const b = bounds(roomPolygon(design.room.shape));

  if (product.mount === "wall") {
    const order = after ? [after.wall, ...walls.map((w) => w.i).filter((i) => i !== after.wall)] : walls.map((w) => w.i);
    for (const wi of order) {
      const w = walls[wi];
      const starts = new Set<number>([0]);
      for (const o of design.items) {
        const op = getProduct(o.product);
        if (!op) continue;
        const on = itemOnWall(o, itemDims(o, op, design.room).d, [w]);
        if (on) { starts.add(on.u0); starts.add(on.u1); }
      }
      for (const o of design.openings) if (o.wall === wi) starts.add(o.offset + o.width / 2);
      let list = [...starts].sort((a, c) => a - c);
      if (after && after.wall === wi) list = [after.u, ...list.filter((s) => s >= after.u), ...list.filter((s) => s < after.u)];
      for (const s of list) {
        const u = s + dm.w / 2;
        if (u + dm.w / 2 > w.len + 0.1) continue;
        const pos = wallPoint(w, u, dm.d / 2 + 0.5);
        const test = { ...probe, x: pos.x, z: pos.z, rot: w.rot };
        if (!findCollision(design, test, walls)) return { x: pos.x, z: pos.z, rot: w.rot };
      }
    }
  }
  for (let r = 0; r < 8; r++) {
    for (let k = 0; k < Math.max(1, r * 8); k++) {
      const a = (k / Math.max(1, r * 8)) * Math.PI * 2;
      const x = b.cx + Math.cos(a) * r * 300, z = b.cz + Math.sin(a) * r * 300;
      if (!findCollision(design, { ...probe, x, z }, walls)) return { x, z, rot: 0 };
    }
  }
  return { x: b.cx, z: b.cz, rot: 0 };
}

// ---------------------------------------------------------------- worktops

export type Run = { x: number; z: number; rot: number; len: number; depth: number };

export function worktopRuns(design: Pick<Design, "items" | "room">): Run[] {
  type Seg = { rot: number; back: number; u0: number; u1: number };
  const segs: Seg[] = [];
  for (const it of design.items) {
    const p = getProduct(it.product);
    if (!p?.worktop) continue;
    const dm = itemDims(it, p, design.room);
    const rot = Math.round((((it.rot % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)) * 1000) / 1000;
    const { ax, az } = axes(rot);
    const u = dot(it, ax);
    segs.push({ rot, back: dot(it, az) - dm.d / 2, u0: u - dm.w / 2, u1: u + dm.w / 2 });
  }
  segs.sort((a, b) => a.rot - b.rot || a.back - b.back || a.u0 - b.u0);
  const runs: Run[] = [];
  let cur: Seg | null = null;
  const flush = () => {
    if (!cur) return;
    const { ax, az } = axes(cur.rot);
    const c = add(mul(ax, (cur.u0 + cur.u1) / 2), mul(az, cur.back + TOP_D / 2));
    runs.push({ x: c.x, z: c.z, rot: cur.rot, len: cur.u1 - cur.u0, depth: TOP_D });
  };
  for (const s of segs) {
    if (cur && Math.abs(s.rot - cur.rot) < 0.002 && Math.abs(s.back - cur.back) < 5 && s.u0 <= cur.u1 + 3) {
      cur.u1 = Math.max(cur.u1, s.u1);
    } else {
      flush();
      cur = { ...s };
    }
  }
  flush();
  return runs;
}

// ---------------------------------------------------------------- fronts

export type FrontKind = "door" | "drawer" | "glass" | "lift" | "oven" | "micro" | "blind" | "dish" | "pull" | "appDoor" | "panel";
export type FrontPanel = { kind: FrontKind; x0: number; x1: number; y0: number; y1: number; hinge?: "l" | "r" | "t" | "b" };

/** Door and drawer layout of a cabinet front, relative to the body's bottom-left corner. */
export function frontLayout(p: Product, w: number, h: number, mirror = false): FrontPanel[] {
  const out: FrontPanel[] = [];
  const doors = (y0: number, y1: number, kind: FrontKind = "door") => {
    if (w > 600) {
      out.push({ kind, x0: 0, x1: w / 2, y0, y1, hinge: "l" }, { kind, x0: w / 2, x1: w, y0, y1, hinge: "r" });
    } else out.push({ kind, x0: 0, x1: w, y0, y1, hinge: "l" });
  };
  const drawers = (fr: number[], y0 = 0, y1 = h) => {
    let y = y0;
    for (const f of fr) {
      const hh = (y1 - y0) * f;
      out.push({ kind: "drawer", x0: 0, x1: w, y0: y, y1: y + hh });
      y += hh;
    }
  };
  switch (p.model) {
    case "doors":
    case "sink":
      doors(0, h);
      break;
    case "glass":
      doors(0, h, "glass");
      break;
    case "drawers":
    case "hob": {
      const n = p.drawers ?? 3;
      drawers(n === 2 ? [0.5, 0.5] : n === 4 ? [0.3, 0.3, 0.2, 0.2] : [0.4, 0.4, 0.2]);
      break;
    }
    case "hobOven":
      out.push({ kind: "oven", x0: 0, x1: w, y0: 0, y1: h - 130 }, { kind: "drawer", x0: 0, x1: w, y0: h - 130, y1: h });
      break;
    case "dishwasher":
      out.push({ kind: "dish", x0: 0, x1: w, y0: 0, y1: h, hinge: "b" });
      break;
    case "corner": {
      const dw = Math.min(450, w / 2);
      out.push({ kind: "blind", x0: 0, x1: w - dw, y0: 0, y1: h }, { kind: "door", x0: w - dw, x1: w, y0: 0, y1: h, hinge: "r" });
      break;
    }
    case "pullout":
      out.push({ kind: "pull", x0: 0, x1: w, y0: 0, y1: h });
      break;
    case "lift":
      if (h <= 420) out.push({ kind: "lift", x0: 0, x1: w, y0: 0, y1: h, hinge: "t" });
      else out.push({ kind: "lift", x0: 0, x1: w, y0: 0, y1: h / 2, hinge: "t" }, { kind: "lift", x0: 0, x1: w, y0: h / 2, y1: h, hinge: "t" });
      break;
    case "tallDoors":
    case "tallPullout":
      doors(0, h - 700);
      doors(h - 700, h);
      break;
    case "tallOven":
      drawers([1], 0, 420);
      out.push({ kind: "oven", x0: 0, x1: w, y0: 420, y1: 1020 });
      doors(1020, h);
      break;
    case "tallOvenMicro":
      drawers([1], 0, 420);
      out.push({ kind: "oven", x0: 0, x1: w, y0: 420, y1: 1020 }, { kind: "micro", x0: 0, x1: w, y0: 1020, y1: 1400 });
      doors(1400, h);
      break;
    case "tallFridge":
      out.push({ kind: "door", x0: 0, x1: w, y0: 0, y1: 760, hinge: "l" }, { kind: "door", x0: 0, x1: w, y0: 760, y1: h, hinge: "l" });
      break;
    case "fridge":
      out.push({ kind: "appDoor", x0: 0, x1: w, y0: 0, y1: 680, hinge: "l" }, { kind: "appDoor", x0: 0, x1: w, y0: 680, y1: h, hinge: "l" });
      break;
    case "fridgeDouble":
      out.push({ kind: "appDoor", x0: 0, x1: w * 0.42, y0: 0, y1: h, hinge: "l" }, { kind: "appDoor", x0: w * 0.42, x1: w, y0: 0, y1: h, hinge: "r" });
      break;
    case "range":
      out.push({ kind: "drawer", x0: 0, x1: w, y0: 0, y1: 150 }, { kind: "oven", x0: 0, x1: w, y0: 150, y1: h - 110 }, { kind: "panel", x0: 0, x1: w, y0: h - 110, y1: h });
      break;
  }
  if (mirror)
    return out.map((f) => ({ ...f, x0: w - f.x1, x1: w - f.x0, hinge: f.hinge === "l" ? "r" : f.hinge === "r" ? "l" : f.hinge }));
  return out;
}

export const isCabinetModel = (p: Product) => p.group === "cabinets" && p.model !== "hood";
