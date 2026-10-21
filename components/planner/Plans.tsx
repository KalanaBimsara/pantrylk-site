"use client";

import { getProduct, itemCode } from "@/lib/planner/catalog";
import { byId, FRONTS, plinthFor, TOP_Y, WALL_T, WORKTOPS } from "@/lib/planner/finishes";
import {
  axes, bounds, footprint, frontLayout, isCabinetModel, itemDims, itemOnWall, outerCorners, roomPolygon, roomWalls, itemBoxes, itemOutline, splashPieces, topThicknessByItem, wallPoint, worktopRuns,
  type FrontPanel,
} from "@/lib/planner/geometry";
import type { Design, Product } from "@/lib/planner/types";

const INK = "#1c334d";
const pts = (p: { x: number; z: number }[]) => p.map((v) => `${v.x.toFixed(1)},${v.z.toFixed(1)}`).join(" ");

function FrontLines({ f, x, y, h, sw, fill = "#fff" }: { f: FrontPanel; x: number; y: number; h: number; sw: number; fill?: string }) {
  // x, y: bottom-left of the body in SVG coords (y grows downward).
  const g = 4;
  const fx = x + f.x0 + g / 2, fw = f.x1 - f.x0 - g;
  const fy = y - f.y1 + g / 2, fh = f.y1 - f.y0 - g;
  const dark = f.kind === "oven" || f.kind === "micro";
  const out = [<rect key="r" x={fx} y={fy} width={fw} height={fh} fill={dark ? "#2b2d30" : fill} stroke={INK} strokeWidth={sw} />];
  if (f.kind === "glass") out.push(<rect key="g" x={fx + 55} y={fy + 55} width={Math.max(0, fw - 110)} height={Math.max(0, fh - 110)} fill="#dcebf2" stroke={INK} strokeWidth={sw * 0.6} />);
  // Hinge markers: lines meeting at the hinge side, the way kitchen drawings show door swings.
  if (f.hinge === "l" || f.hinge === "r") {
    const hx = f.hinge === "l" ? fx : fx + fw, ox = f.hinge === "l" ? fx + fw : fx;
    out.push(<polyline key="h" points={`${ox},${fy} ${hx},${fy + fh / 2} ${ox},${fy + fh}`} fill="none" stroke={INK} strokeWidth={sw * 0.6} strokeDasharray={`${sw * 6} ${sw * 4}`} />);
  }
  if (f.hinge === "t") out.push(<polyline key="h" points={`${fx},${fy + fh} ${fx + fw / 2},${fy} ${fx + fw},${fy + fh}`} fill="none" stroke={INK} strokeWidth={sw * 0.6} strokeDasharray={`${sw * 6} ${sw * 4}`} />);
  if (f.kind === "drawer" || f.kind === "pull") out.push(<line key="d" x1={fx + fw / 2 - Math.min(80, fw / 4)} x2={fx + fw / 2 + Math.min(80, fw / 4)} y1={fy + 40} y2={fy + 40} stroke={INK} strokeWidth={sw * 1.4} />);
  if (dark) out.push(<rect key="o" x={fx + 50} y={fy + 90} width={Math.max(0, fw - 100)} height={Math.max(0, fh - 140)} fill="none" stroke="#9aa0a6" strokeWidth={sw * 0.6} />);
  return <>{out}</>;
}

/** Front elevation of one product, used as catalog thumbnails and in wall elevations. */
export function ProductFront({ p, w, x, y, h, sw, frontColor, mirror = false }: { p: Product; w: number; x: number; y: number; h: number; sw: number; frontColor?: string; mirror?: boolean }) {
  const bodyH = h - p.plinth;
  const fill = frontColor ?? "#fff";
  const body = y - p.plinth;
  const fronts = frontLayout(p, w, p.model === "range" ? h - 10 : bodyH, mirror);
  const els: React.ReactNode[] = [];
  if (p.plinth > 0) els.push(<rect key="pl" x={x + 30} y={y - p.plinth} width={w - 60} height={p.plinth} fill="#c9c4bb" stroke={INK} strokeWidth={sw * 0.6} />);
  if (p.model !== "hood") els.push(<rect key="b" x={x} y={body - bodyH} width={w} height={bodyH} fill={isCabinetModel(p) ? fill : "#e3e6e8"} stroke={INK} strokeWidth={sw} />);
  fronts.forEach((f, k) => els.push(<FrontLines key={k} f={f} x={x} y={p.model === "range" ? y : body} h={bodyH} sw={sw} fill={p.finish ? "#e3e6e8" : fill} />));
  if (p.model === "open") [0.33, 0.66].forEach((k) => els.push(<line key={k} x1={x + 18} x2={x + w - 18} y1={body - bodyH * k} y2={body - bodyH * k} stroke={INK} strokeWidth={sw * 0.6} />));
  if (p.model === "hood") els.push(<path key="hd" d={`M${x} ${y - 60}h${w}v60h${-w}zM${x + w * 0.29} ${y - 60}l${w * 0.06} -240h${w * 0.3}l${w * 0.06} 240M${x + w / 2 - 130} ${y - 300}v-320h260v320`} fill="#e3e6e8" stroke={INK} strokeWidth={sw} />);
  if (p.model === "washer") els.push(<circle key="c" cx={x + w / 2} cy={y - h * 0.45} r={200} fill="#dfe6ea" stroke={INK} strokeWidth={sw} />);
  return <g>{els}</g>;
}

function Glyph({ p, w, h, sw }: { p: Product; w: number; h: number; sw: number }) {
  // Simple side views for things without fronts.
  const s = { fill: "#fff", stroke: INK, strokeWidth: sw };
  switch (p.model) {
    case "table":
    case "roundTable":
      return <path d={`M0 ${-h}h${w}v30h${-w}zM60 ${-h + 30}v${h - 30}M${w - 60} ${-h + 30}v${h - 30}`} {...s} />;
    case "chair":
      return <path d={`M40 -450h${w - 80}v40h${-w + 80}zM60 -410v410M${w - 60} -410v410M50 -450v-430h${w - 100}v430`} {...s} />;
    case "stool":
      return <path d={`M40 ${-h}h${w - 80}v40h${-w + 80}zM80 ${-h + 40}l-30 ${h - 40}M${w - 80} ${-h + 40}l30 ${h - 40}M70 -280h${w - 140}`} {...s} />;
    case "pendant":
      return <path d={`M${w / 2} ${-h - 300}v300M0 0l${w * 0.3} ${-h * 0.6}h${w * 0.4}L${w} 0z`} {...s} />;
    case "columnRound":
      return <rect x={0} y={-h} width={w} height={h} rx={w / 2} {...s} fill="#eee9e1" />;
    default:
      return <rect x={0} y={-h} width={w} height={h} {...s} fill={p.layer === "fixture" ? "#f6f6f4" : "#eee9e1"} />;
  }
}

export function ProductThumb({ p, w, className = "" }: { p: Product; w: number; className?: string }) {
  const h = p.fullHeight ? 2400 : p.height;
  const pad = Math.max(w, h) * 0.08;
  const sw = Math.max(w, h) / 120;
  const front = p.group === "cabinets";
  return (
    <svg viewBox={`${-pad} ${-h - pad} ${w + 2 * pad} ${h + 2 * pad}`} className={className} aria-hidden="true">
      {front || p.model === "fridge" || p.model === "fridgeDouble" || p.model === "range" || p.model === "washer" || p.model === "hood" ? (
        <ProductFront p={p} w={w} x={0} y={0} h={p.model === "hood" ? 620 : h} sw={sw} />
      ) : (
        <Glyph p={p} w={w} h={h} sw={sw} />
      )}
    </svg>
  );
}

// ---------------------------------------------------------------- floor plan

export function FloorPlan({ d, className = "" }: { d: Design; className?: string }) {
  const walls = roomWalls(d.room.shape);
  const poly = roomPolygon(d.room.shape);
  const outer = outerCorners(walls);
  const b = bounds(outer);
  const m = 700;
  const fs = Math.max(b.w, b.d) / 42;
  const sw = Math.max(b.w, b.d) / 900;
  const runs = worktopRuns(d);
  const layerFill: Record<string, string> = { base: "#efe9df", tall: "#d9d1c3", appliance: "#e1e5e8", free: "#f6f3ed", fixture: "#fff", wall: "none" };
  const order = { free: 0, base: 1, appliance: 2, tall: 3, fixture: 4, wall: 5 } as const;
  const items = [...d.items].sort((a, c) => order[getProduct(a.product)?.layer ?? "free"] - order[getProduct(c.product)?.layer ?? "free"]);
  return (
    <svg viewBox={`${b.minX - m} ${b.minZ - m} ${b.w + 2 * m} ${b.d + 2 * m}`} className={className} role="img" aria-label="Floor plan">
      <rect x={b.minX - m} y={b.minZ - m} width={b.w + 2 * m} height={b.d + 2 * m} fill="#fff" />
      <polygon points={pts(outer)} fill="#41454b" />
      <polygon points={pts(poly)} fill="#fbfaf8" />
      {d.openings.map((o) => {
        const w = walls[o.wall];
        if (!w) return null;
        const s = o.offset - o.width / 2, e = o.offset + o.width / 2;
        const gap = [wallPoint(w, s, 1), wallPoint(w, e, 1), wallPoint(w, e, -WALL_T - 1), wallPoint(w, s, -WALL_T - 1)];
        const els = [<polygon key="g" points={pts(gap)} fill="#fff" />];
        if (o.type === "window") {
          for (const k of [0.35, 0.65]) {
            const a = wallPoint(w, s, -WALL_T * k), c = wallPoint(w, e, -WALL_T * k);
            els.push(<line key={k} x1={a.x} y1={a.z} x2={c.x} y2={c.z} stroke={INK} strokeWidth={sw * 1.2} />);
          }
        }
        if (o.type === "door" && o.preset !== "door-sliding") {
          const leaves = o.preset === "door-double" ? 2 : 1;
          const lw = o.width / leaves;
          for (let k = 0; k < leaves; k++) {
            const left = leaves === 2 ? k === 0 : o.hinge !== "r";
            const hu = left ? s : e;
            const h = wallPoint(w, hu), tip = wallPoint(w, hu, lw), end = wallPoint(w, left ? hu + lw : hu - lw);
            const sweep = (left ? 1 : -1) * (w.n.x * w.dir.z - w.n.z * w.dir.x) > 0 ? 1 : 0;
            els.push(<line key={`l${k}`} x1={h.x} y1={h.z} x2={tip.x} y2={tip.z} stroke={INK} strokeWidth={sw * 1.4} />);
            els.push(<path key={`a${k}`} d={`M${tip.x} ${tip.z}A${lw} ${lw} 0 0 ${sweep} ${end.x} ${end.z}`} fill="none" stroke={INK} strokeWidth={sw * 0.7} strokeDasharray={`${sw * 8} ${sw * 6}`} />);
          }
        }
        if (o.preset === "door-sliding") {
          const a = wallPoint(w, s, -WALL_T / 2), c = wallPoint(w, o.offset + 50, -WALL_T / 2);
          const a2 = wallPoint(w, o.offset - 50, -WALL_T * 0.25), c2 = wallPoint(w, e, -WALL_T * 0.25);
          els.push(<line key="s1" x1={a.x} y1={a.z} x2={c.x} y2={c.z} stroke={INK} strokeWidth={sw * 2} />, <line key="s2" x1={a2.x} y1={a2.z} x2={c2.x} y2={c2.z} stroke={INK} strokeWidth={sw * 2} />);
        }
        return <g key={o.id}>{els}</g>;
      })}
      {runs.map((r, k) => {
        const fp = footprint(r, r.rot, r.len, r.depth);
        return <polygon key={k} points={pts(fp)} fill="#f3efe6" stroke={INK} strokeWidth={sw * 0.8} />;
      })}
      {items.map((it) => {
        const p = getProduct(it.product);
        if (!p) return null;
        const dm = itemDims(it, p, d.room);
        const fp = itemOutline(it, p, dm);
        const wall = p.layer === "wall";
        const label = itemCode(p, dm.w);
        const { az } = axes(it.rot);
        // Wall units sit over base units, so their label goes near the wall line.
        const lp = wall ? { x: it.x - az.x * (dm.d / 2 - fs * 0.7), z: it.z - az.z * (dm.d / 2 - fs * 0.7) } : { x: it.x + az.x * fs * 0.4, z: it.z + az.z * fs * 0.4 };
        if (p.model === "roundTable" || p.model === "stool" || p.model === "columnRound" || p.model === "bin")
          return <circle key={it.id} cx={it.x} cy={it.z} r={dm.w / 2} fill={layerFill[p.layer]} stroke={INK} strokeWidth={sw} />;
        return (
          <g key={it.id}>
            <polygon points={pts(fp)} fill={p.worktop ? "none" : layerFill[p.layer]} stroke={INK} strokeWidth={sw} strokeDasharray={wall ? `${sw * 10} ${sw * 6}` : undefined} />
            {p.layer !== "fixture" && dm.w > 250 && (
              <text x={lp.x} y={lp.z} fontSize={fs * (dm.w < 450 ? 0.6 : 0.75)} textAnchor="middle" dominantBaseline="middle" fill={INK} fontWeight={600}>{label}</text>
            )}
          </g>
        );
      })}
      {walls.map((w) => {
        const off = WALL_T + 260;
        const a = wallPoint(w, 0, -off), c = wallPoint(w, w.len, -off), mid = wallPoint(w, w.len / 2, -off - fs * 0.2);
        const t1 = wallPoint(w, 0, -off + 80), t2 = wallPoint(w, 0, -off - 80), t3 = wallPoint(w, w.len, -off + 80), t4 = wallPoint(w, w.len, -off - 80);
        const ang = (Math.atan2(w.dir.z, w.dir.x) * 180) / Math.PI;
        const flip = ang > 90 || ang < -90 ? 180 : 0;
        return (
          <g key={w.i} stroke={INK} strokeWidth={sw * 0.8}>
            <line x1={a.x} y1={a.z} x2={c.x} y2={c.z} />
            <line x1={t1.x} y1={t1.z} x2={t2.x} y2={t2.z} />
            <line x1={t3.x} y1={t3.z} x2={t4.x} y2={t4.z} />
            <text x={mid.x} y={mid.z} fontSize={fs} textAnchor="middle" fill={INK} stroke="none" transform={`rotate(${ang + flip} ${mid.x} ${mid.z})`} dy={-fs * 0.35}>
              {Math.round(w.len)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ---------------------------------------------------------------- wall elevation

export function Elevation({ d, wall, className = "" }: { d: Design; wall: number; className?: string }) {
  const walls = roomWalls(d.room.shape);
  const w = walls[wall];
  if (!w) return null;
  const H = d.room.ceiling;
  const m = 520;
  const fs = Math.max(w.len, H) / 40;
  const sw = Math.max(w.len, H) / 900;
  const Y = (y: number) => H - y;
  const on = d.items
    .flatMap((it) => {
      const p = getProduct(it.product);
      if (!p) return [];
      const dm = itemDims(it, p, d.room);
      // Corner units appear on both walls: the back arm, and the side arm with its blind end in the corner.
      return itemBoxes(it, p, dm).flatMap((b, k) => {
        const o = itemOnWall({ ...it, x: b.x, z: b.z, rot: b.rot, width: b.w }, b.d, [w]);
        return o ? [{ it, p, dm: { ...dm, w: b.w }, key: `${it.id}${k}`, mirror: k === 0 ? !!it.mirror : !it.mirror, ...o }] : [];
      });
    })
    .sort((a, b) => (a.p.layer === "fixture" ? 1 : 0) - (b.p.layer === "fixture" ? 1 : 0));
  const allRuns = worktopRuns(d);
  const tops = topThicknessByItem(allRuns);
  const runs = allRuns.filter((r) => {
    if (Math.abs(Math.atan2(Math.sin(r.rot - w.rot), Math.cos(r.rot - w.rot))) > 0.01) return false;
    const back = (r.x - w.a.x) * w.n.x + (r.z - w.a.z) * w.n.z - r.depth / 2;
    return Math.abs(back) < 30;
  });
  const chain = (list: { u0: number; u1: number }[], y: number, key: string) => {
    const xs = [...new Set(list.flatMap((s) => [Math.round(s.u0), Math.round(s.u1)]))].sort((a, b) => a - b);
    if (xs.length < 2) return null;
    return (
      <g key={key} stroke={INK} strokeWidth={sw * 0.7}>
        <line x1={xs[0]} x2={xs.at(-1)} y1={y} y2={y} />
        {xs.map((x) => <line key={x} x1={x} x2={x} y1={y - 60} y2={y + 60} />)}
        {xs.slice(1).map((x, k) => (x - xs[k] > 120 ? <text key={x} x={(x + xs[k]) / 2} y={y - fs * 0.35} fontSize={fs * 0.8} textAnchor="middle" fill={INK} stroke="none">{x - xs[k]}</text> : null))}
      </g>
    );
  };
  const low = on.filter((o) => o.p.layer === "base" || o.p.layer === "tall" || o.p.layer === "appliance");
  const high = on.filter((o) => o.p.layer === "wall");
  return (
    <svg viewBox={`${-m} ${-m} ${w.len + 2 * m} ${H + 2 * m}`} className={className} role="img" aria-label={`Elevation of wall ${wall + 1}`}>
      <rect x={-m} y={-m} width={w.len + 2 * m} height={H + 2 * m} fill="#fff" />
      <rect x={0} y={0} width={w.len} height={H} fill="#f8f6f2" stroke={INK} strokeWidth={sw * 1.6} />
      {d.openings.filter((o) => o.wall === wall).map((o) => (
        <g key={o.id}>
          <rect x={o.offset - o.width / 2} y={Y(o.sill + o.height)} width={o.width} height={o.height} fill={o.type === "window" ? "#e3eef4" : "#fff"} stroke={INK} strokeWidth={sw} />
          {o.type === "window" && <line x1={o.offset} x2={o.offset} y1={Y(o.sill + o.height)} y2={Y(o.sill)} stroke={INK} strokeWidth={sw * 0.7} />}
        </g>
      ))}
      {runs.map((r, k) => {
        const u = (r.x - w.a.x) * w.dir.x + (r.z - w.a.z) * w.dir.z;
        const fill = byId(WORKTOPS, r.spec.material).color;
        return (
          <g key={k}>
            {splashPieces(d, r).map((s, j) => (
              <rect key={j} x={u - r.len / 2 + s.a} y={Y(TOP_Y + s.h)} width={s.b - s.a} height={s.h} fill={fill} fillOpacity={0.35} stroke={INK} strokeWidth={sw * 0.6} />
            ))}
            <rect x={u - r.len / 2} y={Y(TOP_Y)} width={r.len} height={r.spec.thickness} fill={fill} stroke={INK} strokeWidth={sw} />
          </g>
        );
      })}
      {on.map(({ it, p, dm, u0, key, mirror }) => {
        const front = isCabinetModel(p) ? byId(FRONTS, it.front ?? d.style.front).color : undefined;
        const light = front ? parseInt(front.slice(1, 3), 16) > 120 : true;
        return (
          <g key={key} transform={`translate(${u0} 0)`}>
            {isCabinetModel(p) || ["fridge", "fridgeDouble", "range", "washer", "hood"].includes(p.model) ? (
              <ProductFront p={tops.has(it.id) ? { ...p, plinth: plinthFor(tops.get(it.id)!) } : p} w={dm.w} x={0} y={Y(dm.y0)} h={tops.has(it.id) ? TOP_Y - tops.get(it.id)! : dm.h} sw={sw} frontColor={light ? "#fff" : "#e8e4dc"} mirror={mirror} />
            ) : (
              <g transform={`translate(0 ${Y(dm.y0)})`}>
                <Glyph p={p} w={dm.w} h={dm.h} sw={sw} />
              </g>
            )}
          </g>
        );
      })}
      {chain(low, H + 230, "low")}
      {chain(high, -230, "high")}
      <g stroke={INK} strokeWidth={sw * 0.7}>
        <line x1={0} x2={w.len} y1={H + 420} y2={H + 420} />
        <line x1={0} x2={0} y1={H + 360} y2={H + 480} />
        <line x1={w.len} x2={w.len} y1={H + 360} y2={H + 480} />
        <text x={w.len / 2} y={H + 420 - fs * 0.35} fontSize={fs} textAnchor="middle" fill={INK} stroke="none" fontWeight={700}>{Math.round(w.len)}</text>
        <line x1={w.len + 260} x2={w.len + 260} y1={0} y2={H} />
        <text x={w.len + 260 + fs * 0.4} y={H / 2} fontSize={fs} fill={INK} stroke="none" transform={`rotate(90 ${w.len + 260 + fs * 0.4} ${H / 2})`} textAnchor="middle">{H}</text>
        {runs.length > 0 && <text x={-80} y={Y(TOP_Y)} fontSize={fs * 0.75} textAnchor="end" dominantBaseline="middle" fill={INK} stroke="none">{TOP_Y}</text>}
      </g>
    </svg>
  );
}
