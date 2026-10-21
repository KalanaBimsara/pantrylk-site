"use client";

import { useSyncExternalStore } from "react";
import { z } from "zod";
import { getProduct } from "./catalog";
import { itemDims, roomWalls } from "./geometry";
import { DEFAULT_LIGHTING } from "./lighting";
import type { Design, KitchenStyle, Panel, Selection, View } from "./types";

export const uid = () => Math.random().toString(36).slice(2, 10);

export const DEFAULT_STYLE: KitchenStyle = { front: "matte-white", handle: "bar-steel", worktop: "white-quartz", carcass: "white", topThickness: 20, topEdge: "eased", splash: "none" };

export function newDesign(shape: Design["room"]["shape"] = { kind: "rect", width: 4000, depth: 3400 }): Design {
  const front = shape.kind === "rect" ? 2 : shape.kind === "notch" ? 4 : 3;
  return {
    v: 1,
    name: "My Pantry LK kitchen",
    room: { shape, ceiling: 2700, floor: "light-oak", wallColor: "#f3f0ea" },
    openings: [
      { id: uid(), type: "window", preset: "window", wall: 0, offset: shape.kind === "rect" ? shape.width / 2 : 1400, width: 1200, height: 1200, sill: 1000 },
      { id: uid(), type: "door", preset: "door", wall: front, offset: shape.width - 900, width: 900, height: 2100, sill: 0, hinge: "l" },
    ],
    items: [],
    style: { ...DEFAULT_STYLE },
    lighting: { ...DEFAULT_LIGHTING, zones: { ...DEFAULT_LIGHTING.zones } },
    notes: "",
  };
}

// ---------------------------------------------------------------- validation of untrusted input

const num = z.number().finite();
const shapeSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("rect"), width: num.min(1500).max(20000), depth: num.min(1500).max(20000) }),
  z.object({ kind: z.literal("notch"), width: num.min(1500).max(20000), depth: num.min(1500).max(20000), cutWidth: num.min(300).max(19000), cutDepth: num.min(300).max(19000) }),
  z.object({ kind: z.literal("angled"), width: num.min(1500).max(20000), depth: num.min(1500).max(20000), chamfer: num.min(300).max(19000) }),
]);
const str = z.string().max(80);
const edge = z.enum(["square", "eased", "bevel", "bullnose"]);
const splash = z.enum(["none", "low", "full"]);
const designSchema = z.object({
  v: z.literal(1),
  name: z.string().max(120),
  room: z.object({ shape: shapeSchema, ceiling: num.min(2000).max(6000), floor: str, wallColor: z.string().regex(/^#[0-9a-fA-F]{6}$/) }),
  openings: z
    .array(
      z.object({
        id: str, type: z.enum(["window", "door", "opening"]), preset: str, wall: z.number().int().min(0).max(10),
        offset: num, width: num.min(100).max(10000), height: num.min(100).max(6000), sill: num.min(0).max(6000), hinge: z.enum(["l", "r"]).optional(),
      }),
    )
    .max(50),
  items: z
    .array(
      z.object({
        id: str, product: str, x: num, z: num, rot: num, width: num.min(50).max(5000),
        depth: num.min(50).max(5000).optional(), height: num.min(10).max(6000).optional(), elev: num.min(0).max(6000).optional(),
        front: str.optional(), handle: str.optional(), color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
        mirror: z.boolean().optional(), open: z.boolean().optional(),
        top: z.object({ material: str.optional(), thickness: num.min(6).max(120).optional(), edge: edge.optional(), splash: splash.optional() }).optional(),
        light: z.enum(["on", "off"]).optional(),
      }),
    )
    .max(400),
  style: z.object({
    front: str, handle: str, worktop: str, carcass: str,
    topThickness: num.min(6).max(120).default(DEFAULT_STYLE.topThickness),
    topEdge: edge.default(DEFAULT_STYLE.topEdge),
    splash: splash.default(DEFAULT_STYLE.splash),
  }),
  lighting: z
    .object({
      mode: z.enum(["day", "evening"]),
      color: str,
      brightness: num.min(0.1).max(2),
      zones: z.object({ under: z.boolean(), plinth: z.boolean(), glass: z.boolean(), cove: z.boolean(), shelf: z.boolean() }),
    })
    .default(DEFAULT_LIGHTING),
  notes: z.string().max(2000),
});

export function parseDesign(raw: unknown): Design | null {
  const r = designSchema.safeParse(raw);
  if (!r.success) return null;
  const d = r.data as Design;
  const walls = roomWalls(d.room.shape);
  const items = d.items.filter((i) => getProduct(i.product)).map((i) => {
    const p = getProduct(i.product)!;
    const it = { ...i, open: false };
    if (p.mount !== "wall") return it;
    const dm = itemDims(it, p, d.room);
    for (const w of walls) {
      if (Math.abs(Math.atan2(Math.sin(it.rot - w.rot), Math.cos(it.rot - w.rot))) > 0.01) continue;
      const gap = (it.x - w.a.x) * w.n.x + (it.z - w.a.z) * w.n.z - dm.d / 2;
      if (Math.abs(gap) < 0.6 || Math.abs(gap) > 60) continue;
      return { ...it, x: it.x - w.n.x * (gap - 0.5), z: it.z - w.n.z * (gap - 0.5) };
    }
    return it;
  });
  return { ...d, items };
}

// ---------------------------------------------------------------- store

export type UI = {
  step: 1 | 2 | 3;
  view: View;
  elevWall: number;
  sel: Selection;
  panel: Panel;
  dragging: boolean;
  dragInvalid: boolean;
  showDims: boolean;
  showWallUnits: boolean;
  toast: string | null;
  snapshot: string | null;
  dialog: "start" | "recover" | "tips" | null;
  cmd: { type: "zoomIn" | "zoomOut" | "focus" | "reset"; n: number; id?: string } | null;
  /** Layout lock: units can't be moved, so dragging anywhere just looks around. */
  locked: boolean;
};

export type State = { design: Design; ui: UI; past: Design[]; future: Design[] };

let state: State = {
  design: newDesign(),
  ui: {
    step: 1, view: "plan", elevWall: 0, sel: null, panel: null, dragging: false, dragInvalid: false,
    showDims: true, showWallUnits: true, toast: null, snapshot: null, dialog: null, cmd: null, locked: false,
  },
  past: [],
  future: [],
};

const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export const getState = () => state;

export function usePlanner<T>(sel: (s: State) => T): T {
  return useSyncExternalStore(subscribe, () => sel(state), () => sel(state));
}

export function setUI(patch: Partial<UI> | ((ui: UI) => Partial<UI>)) {
  const p = typeof patch === "function" ? patch(state.ui) : patch;
  state = { ...state, ui: { ...state.ui, ...p } };
  emit();
}

/** Apply a design change. history=false is used for live drag updates. */
export function update(fn: (d: Design) => Design, history = true) {
  const next = fn(state.design);
  if (next === state.design) return;
  state = history
    ? { ...state, design: next, past: [...state.past.slice(-99), state.design], future: [] }
    : { ...state, design: next };
  emit();
}

/** Commit a change that was previewed with update(..., false), recording `before` in history. */
export function commitFrom(before: Design) {
  if (before === state.design) return;
  state = { ...state, past: [...state.past.slice(-99), before], future: [] };
  emit();
}

export function replaceDesign(d: Design, keepHistory = false) {
  state = {
    ...state,
    design: d,
    past: keepHistory ? [...state.past, state.design] : [],
    future: [],
    ui: { ...state.ui, sel: null, panel: null },
  };
  emit();
}

export function undo() {
  const prev = state.past.at(-1);
  if (!prev) return;
  state = { ...state, design: prev, past: state.past.slice(0, -1), future: [state.design, ...state.future], ui: { ...state.ui, sel: validSel(prev, state.ui.sel) } };
  emit();
}

export function redo() {
  const next = state.future[0];
  if (!next) return;
  state = { ...state, design: next, past: [...state.past, state.design], future: state.future.slice(1), ui: { ...state.ui, sel: validSel(next, state.ui.sel) } };
  emit();
}

function validSel(d: Design, sel: Selection): Selection {
  if (!sel) return null;
  if (sel.type === "item" || sel.type === "top") return d.items.some((i) => i.id === sel.id.split("#")[0]) ? sel : null;
  if (sel.type === "opening") return d.openings.some((o) => o.id === sel.id) ? sel : null;
  return sel;
}

let toastTimer: ReturnType<typeof setTimeout> | undefined;
export function toast(msg: string) {
  clearTimeout(toastTimer);
  setUI({ toast: msg });
  toastTimer = setTimeout(() => setUI({ toast: null }), 3200);
}

let cmdN = 0;
export function command(type: NonNullable<UI["cmd"]>["type"], id?: string) {
  setUI({ cmd: { type, id, n: ++cmdN } });
}

// ---------------------------------------------------------------- autosave

export const SAVE_KEY = "pantrylk-planner:v1";
export const LOCK_KEY = "pantrylk-planner:locked";

export function readLocked() {
  try {
    return localStorage.getItem(LOCK_KEY) === "1";
  } catch {
    return false;
  }
}

export function readSaved(): { design: Design; at: number } | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { design: unknown; at: number };
    const design = parseDesign(parsed.design);
    return design ? { design, at: Number(parsed.at) || Date.now() } : null;
  } catch {
    return null;
  }
}

export function startAutosave() {
  let t: ReturnType<typeof setTimeout> | undefined;
  let last = state.design;
  return subscribe(() => {
    if (state.design === last) return;
    last = state.design;
    clearTimeout(t);
    t = setTimeout(() => {
      try {
        localStorage.setItem(SAVE_KEY, JSON.stringify({ design: state.design, at: Date.now() }));
      } catch {
        /* storage full or blocked: the design still lives in memory */
      }
    }, 600);
  });
}
