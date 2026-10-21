import { getProduct } from "@/lib/planner/catalog";
import { WALL_T } from "@/lib/planner/finishes";
import { itemDims, itemOnWall, roomWalls, wallPoint } from "@/lib/planner/geometry";
import type { State } from "@/lib/planner/store";

type P3 = [number, number, number];
export type Measure = {
  lines: { key: string; a: P3; b: P3 }[];
  labels: { key: string; p: P3; text: string; tone: "dark" | "blue" }[];
  tools: { p: P3; id: string } | null;
};

/** Dimension lines and labels for the current view, in millimetres. */
export function measure(s: State): Measure {
  const out: Measure = { lines: [], labels: [], tools: null };
  const { design: d, ui } = s;
  if (ui.view === "walk" || ui.step === 3) return out;
  const walls = roomWalls(d.room.shape);

  if (ui.showDims && ui.view === "plan")
    for (const w of walls) {
      const m = wallPoint(w, w.len / 2, -WALL_T - 260);
      out.labels.push({ key: `w${w.i}`, p: [m.x, 10, m.z], text: `${Math.round(w.len)} mm`, tone: "dark" });
    }

  const it = ui.sel?.type === "item" ? d.items.find((i) => i.id === ui.sel!.id) : undefined;
  const p = it && getProduct(it.product);
  if (!it || !p) return out;
  const dm = itemDims(it, p, d.room);
  if (ui.showDims) {
    const on = itemOnWall(it, dm.d, walls);
    const y = ui.view === "plan" ? dm.y0 + dm.h + 20 : dm.y0 + Math.min(dm.h, 900) + 30;
    if (on) {
      const w = walls[on.wall];
      const inset = dm.d + 120;
      const seg = (u0: number, u1: number, key: string) => {
        if (u1 - u0 < 1) return;
        const a = wallPoint(w, u0, inset), b = wallPoint(w, u1, inset), m = wallPoint(w, (u0 + u1) / 2, inset);
        out.lines.push({ key, a: [a.x, y, a.z], b: [b.x, y, b.z] });
        out.labels.push({ key, p: [m.x, y, m.z], text: String(Math.round(u1 - u0)), tone: "blue" });
      };
      seg(0, on.u0, "gl");
      seg(on.u1, w.len, "gr");
    }
  }
  if (!ui.dragging) out.tools = { p: [it.x, dm.y0 + dm.h + 60, it.z], id: it.id };
  return out;
}
