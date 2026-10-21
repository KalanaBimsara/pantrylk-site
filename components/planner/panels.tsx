"use client";

import { useMemo, useState } from "react";
import {
  addOpening, addProduct, duplicateItem, removeSelection, replaceProduct, rotateItem, setCeiling, setItem, setItemChecked, setOpening, setRoomShape, toggleOpen,
} from "@/lib/planner/actions";
import { getProduct, itemCode, OPENING_PRESETS, PRODUCTS, productsIn, searchProducts } from "@/lib/planner/catalog";
import { byId, CARCASSES, FLOORS, FRONTS, HANDLES, LIGHT_ZONES, TOP_EDGES, WALL_COLORS, WORKTOPS } from "@/lib/planner/finishes";
import { frontLayout, isCabinetModel, itemDims, itemOnWall, roomArea, roomWalls, wallPoint, worktopRuns } from "@/lib/planner/geometry";
import { zonesFor } from "@/lib/planner/lighting";
import { cabinetPrice, formatLKR } from "@/lib/planner/pricing";
import { estimate, partsList } from "@/lib/planner/review";
import { command, getState, setUI, update, usePlanner } from "@/lib/planner/store";
import type { Item, OpeningType, Panel, Product, RoomShape } from "@/lib/planner/types";
import { ProductThumb } from "./Plans";
import { LightsPanel, TopsPanel } from "./TopsLights";
import { Chip, frontSwatchStyle, Icon, mmLabel, NumberField, SectionTitle, Swatch, topSwatchStyle } from "./ui";

const lkr = new Intl.NumberFormat("en-LK", { maximumFractionDigits: 0 });

export function PanelShell(props: { title: string; crumbs?: string; onBack?: () => void; children: React.ReactNode }) {
  return <Shell {...props} />;
}

function Shell({ title, crumbs, onBack, children }: { title: string; crumbs?: string; onBack?: () => void; children: React.ReactNode }) {
  return (
    <aside className="no-print absolute bottom-0 left-0 top-0 z-20 flex w-full flex-col border-r border-line bg-white shadow-[4px_0_18px_rgba(19,37,58,0.08)] sm:w-[372px]">
      <header className="flex items-start gap-2 border-b border-line px-5 pb-3 pt-4">
        {onBack && (
          <button type="button" onClick={onBack} aria-label="Back" className="-ml-2 mt-0.5 grid h-8 w-8 place-items-center hover:bg-stone">
            <Icon name="back" size={18} />
          </button>
        )}
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-[17px] font-bold">{title}</h2>
          {crumbs && <p className="mt-0.5 truncate text-[12.5px] text-muted">{crumbs}</p>}
        </div>
        <button type="button" onClick={() => setUI({ panel: null })} aria-label="Close panel" className="-mr-2 grid h-8 w-8 place-items-center hover:bg-stone">
          <Icon name="close" size={18} />
        </button>
      </header>
      <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
    </aside>
  );
}

// ---------------------------------------------------------------- catalog

function ProductCard({ p, onPick, cta = "Add" }: { p: Product; onPick: (w: number) => void; cta?: string }) {
  const [w, setW] = useState(p.widths[0]);
  return (
    <div className="group flex gap-3 border border-line bg-white p-3 transition-colors hover:border-navy">
      <button type="button" onClick={() => onPick(w)} className="grid h-[92px] w-[84px] shrink-0 place-items-center bg-ivory" aria-label={`${cta} ${p.name}, ${mmLabel(w)}`}>
        <ProductThumb p={p} w={w} className="h-[80px] w-[72px]" />
      </button>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div>
          <p className="text-[13.5px] font-bold leading-snug">{p.name}</p>
          <p className="text-[12.5px] leading-snug text-muted">{p.desc}</p>
        </div>
        {p.widths.length > 1 ? (
          <div className="flex flex-wrap gap-1" role="group" aria-label="Width">
            {p.widths.map((x) => (
              <button key={x} type="button" onClick={() => setW(x)} aria-pressed={x === w} className={`h-6 rounded-full px-2 text-[11.5px] font-semibold tabular-nums ${x === w ? "bg-navy text-ivory" : "bg-stone hover:bg-line"}`}>
                {x / 10}
              </button>
            ))}
            <span className="self-center text-[11px] text-muted">cm</span>
          </div>
        ) : (
          <p className="text-[12px] tabular-nums text-ink-2">{p.resizable ? "Resizable" : `${mmLabel(w)} wide`}</p>
        )}
        <div className="mt-auto flex items-center justify-between">
          <span className="flex flex-col text-[12px] leading-tight text-ink-2">
            <span className="tabular-nums">{w}×{p.fullHeight ? 2400 : p.height - p.plinth}×{p.depth} mm</span>
            {cabinetPrice(p, w) != null && <span className="font-bold tabular-nums text-navy">{formatLKR(cabinetPrice(p, w)!)}</span>}
          </span>
          <button type="button" onClick={() => onPick(w)} className="h-8 rounded-[2px] bg-navy px-3 text-[12.5px] font-semibold text-ivory hover:bg-navy-2">
            {cta}
          </button>
        </div>
      </div>
    </div>
  );
}

function SearchBox({ value, onChange, autoFocus }: { value: string; onChange: (v: string) => void; autoFocus?: boolean }) {
  return (
    <label className="mb-4 flex h-10 items-center gap-2 rounded-full border border-[#b9b2a6] px-4 focus-within:border-navy">
      <Icon name="search" size={17} className="text-muted" />
      <input autoFocus={autoFocus} value={value} onChange={(e) => onChange(e.target.value)} placeholder="Search products" aria-label="Search products" className="h-full min-w-0 flex-1 bg-transparent text-[14px] outline-none" />
    </label>
  );
}

function CatalogPanel({ panel }: { panel: Extract<Panel, { kind: "catalog" }> }) {
  const [q, setQ] = useState("");
  const list = q ? searchProducts(q).filter((p) => p.group === panel.group || panel.group !== "elements") : productsIn(panel.sub);
  const [section, sub] = panel.sub.split("/");
  return (
    <Shell title={panel.group === "elements" ? "Add an existing element" : "Add an item"} crumbs={`${section} / ${sub}`}>
      <SearchBox value={q} onChange={setQ} />
      <p className="mb-3 text-[12.5px] text-muted">{list.length} product{list.length === 1 ? "" : "s"}</p>
      <div className="flex flex-col gap-2.5">
        {list.map((p) => <ProductCard key={p.id} p={p} onPick={(w) => addProduct(p.id, w)} />)}
      </div>
      <p className="mt-5 text-[12px] leading-relaxed text-muted">Click to add — items line up along the walls automatically. Drag them in the room to move; they snap to walls and neighbours.</p>
    </Shell>
  );
}

function SearchPanel() {
  const [q, setQ] = useState("");
  const step = usePlanner((s) => s.ui.step);
  const list = q ? searchProducts(q) : PRODUCTS.filter((p) => (step === 1 ? p.group === "elements" : p.group !== "elements")).slice(0, 12);
  return (
    <Shell title="Search" crumbs={q ? `${list.length} results` : "Popular items"}>
      <SearchBox value={q} onChange={setQ} autoFocus />
      <div className="flex flex-col gap-2.5">
        {list.map((p) => <ProductCard key={p.id} p={p} onPick={(w) => addProduct(p.id, w)} />)}
        {q && !list.length && <p className="text-[14px] text-muted">No products match “{q}”.</p>}
      </div>
    </Shell>
  );
}

// ---------------------------------------------------------------- selected item

export function itemActions(it: Item, p: Product) {
  const hasFronts = frontLayout(p, it.width, p.height - p.plinth).some((f) => f.hinge || f.kind === "drawer" || f.kind === "pull");
  return [
    { id: "modify", label: "Modify", icon: "modify", run: () => setUI({ panel: { kind: "selected", tab: "modify" } }) },
    { id: "replace", label: "Replace", icon: "replace", run: () => setUI({ panel: { kind: "selected", tab: "replace" } }), hide: p.group === "elements" },
    { id: "open", label: it.open ? "Close" : "Open", icon: "door", run: () => toggleOpen(it.id), hide: !hasFronts },
    { id: "zoom", label: "Zoom to", icon: "zoom", run: () => command("focus", it.id) },
    { id: "position", label: "Position", icon: "position", run: () => setUI({ panel: { kind: "selected", tab: "position" } }) },
    { id: "duplicate", label: "Duplicate", icon: "duplicate", run: () => duplicateItem(it.id) },
    { id: "remove", label: "Remove", icon: "trash", run: () => removeSelection() },
  ].filter((a) => !a.hide && !(getState().ui.locked && ["replace", "position", "duplicate", "remove"].includes(a.id)));
}

function ActionRow({ it, p }: { it: Item; p: Product }) {
  usePlanner((s) => s.ui.locked); // re-render when the layout lock changes the available actions
  return (
    <div className="flex flex-wrap gap-0.5">
      {itemActions(it, p).map((a) => (
        <button key={a.id} type="button" onClick={a.run} className="flex w-[46px] flex-col items-center gap-1 py-1.5 text-[10.5px] text-ink-2 hover:bg-stone hover:text-navy">
          <Icon name={a.icon} size={18} />
          {a.label}
        </button>
      ))}
    </div>
  );
}

export function SelectionCard() {
  const sel = usePlanner((s) => s.ui.sel);
  const panel = usePlanner((s) => s.ui.panel);
  const items = usePlanner((s) => s.design.items);
  const room = usePlanner((s) => s.design.room);
  const dragging = usePlanner((s) => s.ui.dragging);
  if (sel?.type !== "item" || panel?.kind === "selected" || dragging) return null;
  const it = items.find((i) => i.id === sel.id);
  const p = it && getProduct(it.product);
  if (!it || !p) return null;
  const dm = itemDims(it, p, room);
  return (
    <div className={`no-print absolute top-3 z-20 w-[340px] max-w-[calc(100%-24px)] border border-line bg-white p-3 shadow-[0_6px_24px_rgba(19,37,58,0.14)] ${panel ? "left-3 sm:left-[384px]" : "left-3"}`}>
      <p className="text-[14px] font-bold">{p.name}</p>
      <p className="mb-2 text-[12px] tabular-nums text-muted">{itemCode(p, dm.w)} · {dm.w}×{dm.d}×{dm.h} mm</p>
      <ActionRow it={it} p={p} />
    </div>
  );
}

function SelectedPanel({ tab }: { tab: "modify" | "position" | "replace" }) {
  const sel = usePlanner((s) => s.ui.sel);
  const d = usePlanner((s) => s.design);
  const it = sel?.type === "item" ? d.items.find((i) => i.id === sel.id) : undefined;
  const p = it && getProduct(it.product);
  if (!it || !p) return null;
  const dm = itemDims(it, p, d.room);
  const cabinet = isCabinetModel(p);
  const walls = roomWalls(d.room.shape);
  const on = itemOnWall(it, dm.d, walls);
  const tabs: ["modify" | "position" | "replace", string][] = [["modify", "Modify"], ["position", "Position"], ...(p.group === "elements" ? [] : [["replace", "Replace"] as ["replace", string]])];
  const hasHinge = frontLayout(p, it.width, p.height - p.plinth).some((f) => f.hinge === "l" || f.hinge === "r" || f.kind === "blind");

  return (
    <Shell title={p.name} crumbs={`${itemCode(p, dm.w)} · ${dm.w}×${dm.d}×${dm.h} mm`}>
      <ActionRow it={it} p={p} />
      <div className="mt-3 flex border-b border-line" role="tablist">
        {tabs.map(([id, label]) => (
          <button key={id} role="tab" type="button" aria-selected={tab === id} onClick={() => setUI({ panel: { kind: "selected", tab: id } })} className={`-mb-px border-b-2 px-3 py-2 text-[13.5px] font-semibold ${tab === id ? "border-navy" : "border-transparent text-muted hover:text-navy"}`}>
            {label}
          </button>
        ))}
      </div>
      <div className="pt-5">
        {tab === "modify" && (
          <>
            {p.resizable ? (
              <>
                <SectionTitle>Size</SectionTitle>
                <div className="grid grid-cols-3 gap-2">
                  <NumberField label="Width" value={dm.w} min={50} max={5000} onChange={(v) => setItemChecked(it.id, { width: v })} />
                  <NumberField label="Depth" value={dm.d} min={50} max={5000} onChange={(v) => setItemChecked(it.id, { depth: v })} />
                  <NumberField label="Height" value={dm.h} min={10} max={d.room.ceiling} onChange={(v) => setItemChecked(it.id, { height: v })} />
                </div>
                <SectionTitle>Colour</SectionTitle>
                <div className="grid grid-cols-5 gap-2">
                  {WALL_COLORS.map((c) => <Swatch key={c.hex} label={c.name} style={{ background: c.hex }} active={(it.color ?? "#e9e5de") === c.hex} onClick={() => setItem(it.id, { color: c.hex })} />)}
                </div>
              </>
            ) : (
              p.widths.length > 1 && (
                <>
                  <SectionTitle>Width</SectionTitle>
                  <div className="flex flex-wrap gap-1.5">
                    {p.widths.map((w) => <Chip key={w} active={w === it.width} onClick={() => setItemChecked(it.id, { width: w })}>{w / 10} cm</Chip>)}
                  </div>
                </>
              )
            )}
            {cabinet && (
              <>
                <SectionTitle>Door & drawer fronts</SectionTitle>
                <button type="button" onClick={() => setItem(it.id, { front: undefined })} className={`mb-3 text-[12.5px] font-semibold ${it.front ? "text-[#2f7be0] hover:underline" : "text-muted"}`}>
                  {it.front ? "Use kitchen style" : `Using kitchen style: ${byId(FRONTS, d.style.front).name}`}
                </button>
                <div className="grid grid-cols-4 gap-x-2 gap-y-3">
                  {FRONTS.map((f) => <Swatch key={f.id} label={f.name} style={frontSwatchStyle(f)} shaker={f.shaker} active={(it.front ?? d.style.front) === f.id} onClick={() => setItem(it.id, { front: f.id })} />)}
                </div>
                <SectionTitle>Handle</SectionTitle>
                <select value={it.handle ?? ""} onChange={(e) => setItem(it.id, { handle: e.target.value || undefined })} className="field !min-h-10 text-[14px]">
                  <option value="">Kitchen style ({byId(HANDLES, d.style.handle).name})</option>
                  {HANDLES.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
                </select>
              </>
            )}
            {(hasHinge || cabinet) && (
              <div className="mt-6 flex flex-wrap gap-2">
                {hasHinge && <button type="button" onClick={() => setItem(it.id, { mirror: !it.mirror })} className="btn btn-outline !min-h-10 !px-4 !text-[13px]"><Icon name="flip" size={16} /> Flip hinge side</button>}
                <button type="button" onClick={() => toggleOpen(it.id)} className="btn btn-outline !min-h-10 !px-4 !text-[13px]"><Icon name="door" size={16} /> {it.open ? "Close fronts" : "Open fronts"}</button>
              </div>
            )}
            {p.worktop && (() => {
              const run = worktopRuns(d).find((r) => r.ids.includes(it.id));
              if (!run) return null;
              const w = byId(WORKTOPS, run.spec.material);
              return (
                <>
                  <SectionTitle>Pantry top for this section</SectionTitle>
                  <button type="button" onClick={() => setUI({ sel: { type: "top", id: run.ref }, panel: { kind: "tops" } })} className="flex w-full items-center gap-3 border border-line p-2.5 text-left hover:border-navy">
                    <span className="h-9 w-12 shrink-0 ring-1 ring-black/10" style={topSwatchStyle(w)} />
                    <span className="min-w-0 flex-1 text-[13px]"><span className="block font-semibold">{w.name}</span><span className="text-[12px] text-muted">{run.spec.thickness} mm · {(run.len / 1000).toFixed(2)} m section</span></span>
                    <Icon name="chevron" size={16} />
                  </button>
                </>
              );
            })()}
            {(zonesFor(p).length > 0 || p.model === "pendant" || p.model === "downlight") && (
              <>
                <SectionTitle>LED lighting</SectionTitle>
                <div className="flex flex-wrap gap-1.5">
                  {zonesFor(p).some((z) => z !== "custom") && <Chip active={!it.light} onClick={() => setItem(it.id, { light: undefined })}>Follow kitchen</Chip>}
                  <Chip active={it.light === "on" || (!it.light && !zonesFor(p).some((z) => z !== "custom"))} onClick={() => setItem(it.id, { light: "on" })}>On</Chip>
                  <Chip active={it.light === "off"} onClick={() => setItem(it.id, { light: "off" })}>Off</Chip>
                </div>
                {zonesFor(p).some((z) => z !== "custom") && (
                  <p className="mt-2 text-[12px] text-muted">
                    Strips here: {zonesFor(p).map((z) => LIGHT_ZONES.find((x) => x.id === z)?.name.toLowerCase()).join(", ")}.{" "}
                    <button type="button" className="font-semibold text-[#2f7be0] hover:underline" onClick={() => setUI({ panel: { kind: "lights" } })}>Kitchen lighting</button>
                  </p>
                )}
              </>
            )}
          </>
        )}
        {tab === "position" && (
          <>
            {on ? (
              <>
                <p className="mb-4 text-[13px] text-ink-2">Against wall {on.wall + 1} ({Math.round(walls[on.wall].len)} mm long).</p>
                <div className="grid grid-cols-2 gap-2">
                  <NumberField label="From left end" value={on.u0} min={0} max={walls[on.wall].len - dm.w} onChange={(v) => {
                    const w = walls[on.wall];
                    const pos = wallPoint(w, v + dm.w / 2, dm.d / 2 + 0.5);
                    setItemChecked(it.id, { x: pos.x, z: pos.z });
                  }} />
                  <NumberField label="From right end" value={walls[on.wall].len - on.u1} min={0} max={walls[on.wall].len - dm.w} onChange={(v) => {
                    const w = walls[on.wall];
                    const pos = wallPoint(w, w.len - v - dm.w / 2, dm.d / 2 + 0.5);
                    setItemChecked(it.id, { x: pos.x, z: pos.z });
                  }} />
                </div>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <NumberField label="X (from left)" value={it.x} onChange={(v) => setItemChecked(it.id, { x: v })} />
                <NumberField label="Y (from back)" value={it.z} onChange={(v) => setItemChecked(it.id, { z: v })} />
              </div>
            )}
            <div className="mt-3 grid grid-cols-2 gap-2">
              <NumberField label="Height above floor" value={dm.y0} min={0} max={d.room.ceiling - dm.h} onChange={(v) => setItemChecked(it.id, { elev: v })} />
              <NumberField label="Rotation" suffix="°" step={15} value={Math.round(((((it.rot * 180) / Math.PI) % 360) + 360) % 360)} onChange={(v) => setItemChecked(it.id, { rot: (v * Math.PI) / 180 })} />
            </div>
            <div className="mt-4 flex gap-2">
              <button type="button" onClick={() => rotateItem(it.id, -1)} className="btn btn-outline !min-h-10 flex-1 !text-[13px]"><Icon name="rotate" size={16} className="-scale-x-100" /> Rotate left</button>
              <button type="button" onClick={() => rotateItem(it.id, 1)} className="btn btn-outline !min-h-10 flex-1 !text-[13px]"><Icon name="rotate" size={16} /> Rotate right</button>
            </div>
            {it.elev != null && <button type="button" onClick={() => setItemChecked(it.id, { elev: undefined })} className="mt-4 text-[12.5px] font-semibold text-[#2f7be0] hover:underline">Reset to standard height</button>}
          </>
        )}
        {tab === "replace" && (
          <div className="flex flex-col gap-2.5">
            <p className="text-[13px] text-ink-2">Swap this {p.layer === "wall" ? "wall unit" : p.layer === "tall" ? "high cabinet" : "item"} for another — position is kept.</p>
            {PRODUCTS.filter((x) => x.id !== p.id && x.layer === p.layer && x.mount === p.mount && x.group !== "elements").map((x) => (
              <ProductCard key={x.id} p={x} cta="Replace" onPick={() => replaceProduct(it.id, x.id)} />
            ))}
          </div>
        )}
      </div>
    </Shell>
  );
}

// ---------------------------------------------------------------- room

const SHAPES: { kind: RoomShape["kind"]; label: string; path: string }[] = [
  { kind: "rect", label: "Rectangle", path: "M4 4h40v40H4z" },
  { kind: "notch", label: "Notched corner", path: "M4 4h26v12h14v28H4z" },
  { kind: "angled", label: "Angled corner", path: "M4 4h28l12 12v28H4z" },
];

export function changeShape(kind: RoomShape["kind"]) {
  const s = getState().design.room.shape;
  const { width, depth } = s;
  if (kind === s.kind) return;
  setRoomShape(kind === "rect" ? { kind, width, depth } : kind === "notch" ? { kind, width, depth, cutWidth: 1200, cutDepth: 1000 } : { kind, width, depth, chamfer: 1000 });
}

function RoomPanel() {
  const room = usePlanner((s) => s.design.room);
  const sel = usePlanner((s) => s.ui.sel);
  const s = room.shape;
  const walls = useMemo(() => roomWalls(s), [s]);
  const set = (patch: Partial<RoomShape>) => setRoomShape({ ...s, ...patch } as RoomShape);
  const selWall = sel?.type === "wall" ? walls[Number(sel.id)] : undefined;
  return (
    <Shell title="Room shape & size" crumbs={`${roomArea(s).toFixed(1)} m² floor area`}>
      <SectionTitle>Shape</SectionTitle>
      <div className="grid grid-cols-3 gap-2">
        {SHAPES.map((x) => (
          <button key={x.kind} type="button" onClick={() => changeShape(x.kind)} aria-pressed={s.kind === x.kind} className={`flex flex-col items-center gap-1.5 border p-2.5 text-[11.5px] ${s.kind === x.kind ? "border-[#2f7be0] bg-[#eaf2fc]" : "border-line hover:border-navy"}`}>
            <svg viewBox="0 0 48 48" className="h-10 w-10" aria-hidden="true"><path d={x.path} fill={s.kind === x.kind ? "#b7d0ee" : "#fff"} stroke="#1c334d" strokeWidth="2" /></svg>
            {x.label}
          </button>
        ))}
      </div>
      <SectionTitle>Measurements (inside the walls)</SectionTitle>
      <div className="grid grid-cols-2 gap-2">
        <NumberField label="Width" value={s.width} min={1500} max={20000} onChange={(v) => set({ width: v })} />
        <NumberField label="Depth" value={s.depth} min={1500} max={20000} onChange={(v) => set({ depth: v })} />
        {s.kind === "notch" && (
          <>
            <NumberField label="Cut-out width" value={s.cutWidth} min={300} max={s.width - 600} onChange={(v) => set({ cutWidth: v })} />
            <NumberField label="Cut-out depth" value={s.cutDepth} min={300} max={s.depth - 600} onChange={(v) => set({ cutDepth: v })} />
          </>
        )}
        {s.kind === "angled" && <NumberField label="Corner cut" value={s.chamfer} min={300} max={Math.min(s.width, s.depth) - 600} onChange={(v) => set({ chamfer: v })} />}
        <NumberField label="Ceiling height" value={room.ceiling} min={2000} max={6000} onChange={setCeiling} />
      </div>
      <SectionTitle>Walls</SectionTitle>
      <ul className="flex flex-col gap-1">
        {walls.map((w) => {
          const active = selWall?.i === w.i;
          return (
            <li key={w.i}>
              <button type="button" onClick={() => setUI({ sel: { type: "wall", id: String(w.i) } })} className={`flex w-full items-center justify-between border px-3 py-2 text-left text-[13.5px] ${active ? "border-[#2f7be0] bg-[#eaf2fc]" : "border-line hover:border-navy"}`}>
                <span className="font-semibold">Wall {w.i + 1}</span>
                <span className="tabular-nums text-ink-2">{Math.round(w.len)} mm</span>
              </button>
              {active && (
                <div className="flex flex-wrap gap-1.5 border-x border-b border-[#2f7be0] bg-[#f5f9fe] p-2.5">
                  <button type="button" className="btn btn-outline !min-h-9 !px-3 !text-[12.5px]" onClick={() => addOpening("window")}>+ Window</button>
                  <button type="button" className="btn btn-outline !min-h-9 !px-3 !text-[12.5px]" onClick={() => addOpening("door")}>+ Door</button>
                  <button type="button" className="btn btn-outline !min-h-9 !px-3 !text-[12.5px]" onClick={() => setUI({ view: "elevation", elevWall: w.i })}>View wall</button>
                </div>
              )}
            </li>
          );
        })}
      </ul>
      <p className="mt-4 text-[12px] leading-relaxed text-muted">Tip: click a wall in the room to select it. Measure from wall to wall, at worktop height.</p>
    </Shell>
  );
}

function SurfacesPanel() {
  const room = usePlanner((s) => s.design.room);
  return (
    <Shell title="Floor & walls">
      <SectionTitle>Floor</SectionTitle>
      <div className="grid grid-cols-3 gap-x-2 gap-y-3">
        {FLOORS.map((f) => (
          <Swatch key={f.id} label={f.name} active={room.floor === f.id} onClick={() => update((d) => ({ ...d, room: { ...d.room, floor: f.id } }))}
            style={f.pattern === "planks" ? { background: `repeating-linear-gradient(0deg, ${f.color} 0 13px, ${f.accent} 13px 14px)` } : f.pattern === "tiles" ? { background: `repeating-linear-gradient(0deg, ${f.accent} 0 1px, transparent 1px 18px), repeating-linear-gradient(90deg, ${f.accent} 0 1px, ${f.color} 1px 18px)` } : { background: `radial-gradient(${f.accent} 1px, transparent 1.5px) 0 0/7px 7px, ${f.color}` }} />
        ))}
      </div>
      <SectionTitle>Wall colour</SectionTitle>
      <div className="grid grid-cols-4 gap-x-2 gap-y-3">
        {WALL_COLORS.map((c) => <Swatch key={c.hex} label={c.name} style={{ background: c.hex }} active={room.wallColor === c.hex} onClick={() => update((d) => ({ ...d, room: { ...d.room, wallColor: c.hex } }))} />)}
      </div>
      <label className="mt-4 flex items-center gap-3 text-[13px] font-semibold">
        Custom
        <input type="color" value={room.wallColor} onChange={(e) => update((d) => ({ ...d, room: { ...d.room, wallColor: e.target.value } }))} className="h-9 w-14 cursor-pointer border border-line" />
      </label>
    </Shell>
  );
}

const OPENING_TITLES: Record<OpeningType, string> = { window: "Windows", door: "Doors", opening: "Wall openings" };

function OpeningsPanel({ type }: { type: OpeningType }) {
  const sel = usePlanner((s) => s.ui.sel);
  const d = usePlanner((s) => s.design);
  const o = sel?.type === "opening" ? d.openings.find((x) => x.id === sel.id) : undefined;
  const walls = roomWalls(d.room.shape);
  return (
    <Shell title={o ? OPENING_TITLES[o.type].replace(/s$/, "") : OPENING_TITLES[type]} crumbs={o ? `Wall ${o.wall + 1}` : "Click to add, then drag along the wall"} onBack={o ? () => setUI({ sel: null }) : undefined}>
      {o ? (
        <>
          <label className="mb-3 flex flex-col gap-1">
            <span className="text-[12.5px] font-semibold text-ink-2">Wall</span>
            <select value={o.wall} onChange={(e) => setOpening(o.id, { wall: Number(e.target.value) })} className="field !min-h-10 text-[14px]">
              {walls.map((w) => <option key={w.i} value={w.i}>Wall {w.i + 1} ({Math.round(w.len)} mm)</option>)}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-2">
            <NumberField label="From left end" value={o.offset - o.width / 2} min={0} onChange={(v) => setOpening(o.id, { offset: v + o.width / 2 })} />
            <NumberField label="Width" value={o.width} min={300} max={6000} onChange={(v) => setOpening(o.id, { width: v })} />
            <NumberField label="Height" value={o.height} min={300} max={d.room.ceiling} onChange={(v) => setOpening(o.id, { height: v })} />
            {o.type !== "door" && <NumberField label="Height from floor" value={o.sill} min={0} max={d.room.ceiling - 300} onChange={(v) => setOpening(o.id, { sill: v })} />}
          </div>
          {o.type === "door" && o.preset === "door" && (
            <div className="mt-4 flex gap-1.5">
              <Chip active={o.hinge !== "r"} onClick={() => setOpening(o.id, { hinge: "l" })}>Hinge left</Chip>
              <Chip active={o.hinge === "r"} onClick={() => setOpening(o.id, { hinge: "r" })}>Hinge right</Chip>
            </div>
          )}
          <button type="button" onClick={removeSelection} className="btn btn-outline mt-6 !min-h-10 !text-[13px]"><Icon name="trash" size={16} /> Remove</button>
        </>
      ) : (
        <div className="flex flex-col gap-2.5">
          {OPENING_PRESETS.filter((p) => p.type === type).map((p) => (
            <button key={p.id} type="button" onClick={() => addOpening(p.id)} className="flex items-center gap-4 border border-line p-3 text-left hover:border-navy">
              <svg viewBox="-50 -2300 2000 2400" className="h-16 w-16 shrink-0 bg-ivory" aria-hidden="true">
                <rect x={(1900 - p.width) / 2} y={-p.sill - p.height} width={p.width} height={p.height} fill={p.type === "window" ? "#dcebf2" : "#fff"} stroke="#1c334d" strokeWidth="40" />
                <line x1="-50" x2="1950" y1="0" y2="0" stroke="#1c334d" strokeWidth="40" />
              </svg>
              <span>
                <span className="block text-[14px] font-bold">{p.name}</span>
                <span className="text-[12.5px] tabular-nums text-muted">{p.width}×{p.height} mm{p.sill ? `, ${p.sill} mm from floor` : ""}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </Shell>
  );
}

function StylePanel() {
  const style = usePlanner((s) => s.design.style);
  const overrides = usePlanner((s) => s.design.items.filter((i) => i.front || i.handle).length);
  const set = (patch: Partial<typeof style>) => update((d) => ({ ...d, style: { ...d.style, ...patch } }));
  return (
    <Shell title="Kitchen style" crumbs="Applies to every cabinet in the design">
      <SectionTitle>Fronts</SectionTitle>
      <div className="grid grid-cols-4 gap-x-2 gap-y-3">
        {FRONTS.map((f) => <Swatch key={f.id} label={f.name} style={frontSwatchStyle(f)} shaker={f.shaker} active={style.front === f.id} onClick={() => set({ front: f.id })} />)}
      </div>
      <SectionTitle>Handles</SectionTitle>
      <div className="grid grid-cols-2 gap-1.5">
        {HANDLES.map((h) => (
          <button key={h.id} type="button" onClick={() => set({ handle: h.id })} aria-pressed={style.handle === h.id} className={`flex items-center gap-2 border px-2.5 py-2 text-left text-[12.5px] ${style.handle === h.id ? "border-[#2f7be0] bg-[#eaf2fc]" : "border-line hover:border-navy"}`}>
            <span className="h-4 w-4 shrink-0 rounded-full ring-1 ring-black/10" style={{ background: h.type === "none" ? "#fff" : h.color }} />
            {h.name}
          </button>
        ))}
      </div>
      <SectionTitle>Pantry tops</SectionTitle>
      <button type="button" onClick={() => setUI({ sel: null, panel: { kind: "tops" } })} className="flex w-full items-center gap-3 border border-line p-2.5 text-left hover:border-navy">
        <span className="h-10 w-14 shrink-0 ring-1 ring-black/10" style={topSwatchStyle(byId(WORKTOPS, style.worktop))} />
        <span className="min-w-0 flex-1">
          <span className="block text-[13.5px] font-semibold">{byId(WORKTOPS, style.worktop).name}</span>
          <span className="block text-[12px] text-muted">{style.topThickness} mm · {TOP_EDGES.find((e) => e.id === style.topEdge)?.name} edge</span>
        </span>
        <Icon name="chevron" size={16} />
      </button>
      <SectionTitle>Cabinet sides</SectionTitle>
      <div className="flex gap-1.5">
        {CARCASSES.map((c) => <Chip key={c.id} active={style.carcass === c.id} onClick={() => set({ carcass: c.id })}>{c.name}</Chip>)}
      </div>
      {overrides > 0 && (
        <button type="button" onClick={() => update((d) => ({ ...d, items: d.items.map((i) => ({ ...i, front: undefined, handle: undefined })) }))} className="btn btn-outline mt-6 !min-h-10 w-full !text-[13px]">
          Apply style to all {overrides} customised cabinet{overrides === 1 ? "" : "s"}
        </button>
      )}
    </Shell>
  );
}

function ListPanel() {
  const d = usePlanner((s) => s.design);
  const lines = useMemo(() => partsList(d), [d]);
  const total = estimate(lines);
  return (
    <Shell title="Your item list" crumbs={`${d.items.length} item${d.items.length === 1 ? "" : "s"} in the design`}>
      {lines.length === 0 && <p className="text-[14px] text-muted">Nothing added yet.</p>}
      <ul className="flex flex-col divide-y divide-line border-y border-line">
        {lines.map((l) => (
          <li key={l.key}>
            <button
              type="button"
              className="flex w-full items-start gap-3 py-2.5 text-left hover:bg-ivory"
              onClick={() => {
                if (l.code === "TOP" || l.code === "LED") return setUI({ sel: null, panel: { kind: l.code === "TOP" ? "tops" : "lights" } });
                const it = d.items.find((i) => i.product === l.productId);
                if (it) {
                  setUI({ sel: { type: "item", id: it.id } });
                  command("focus", it.id);
                }
              }}
            >
              <span className="w-8 shrink-0 text-[13px] font-bold tabular-nums">{l.qty}×</span>
              <span className="min-w-0 flex-1">
                <span className="block text-[13.5px] font-semibold">{l.name}</span>
                <span className="block text-[12px] text-muted">{l.code} · {l.detail}</span>
              </span>
              {l.price != null && <span className="text-[12.5px] tabular-nums">LKR {lkr.format(l.price * l.qty)}</span>}
            </button>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-[13px] text-ink-2">
        {total ? (
          <>
            Estimated total <strong>LKR {lkr.format(total.total)}</strong>
            {total.unpriced > 0 && <> plus {total.unpriced} item{total.unpriced === 1 ? "" : "s"} quoted separately</>}. Cabinets are LKR 7,100 per sq ft of front; granite LKR 3,200 per sq ft.
          </>
        ) : "Prices are confirmed in your quotation from Pantry LK."}
      </p>
    </Shell>
  );
}

export function SidePanel() {
  const panel = usePlanner((s) => s.ui.panel);
  if (!panel) return null;
  switch (panel.kind) {
    case "catalog":
      return <CatalogPanel key={panel.sub} panel={panel} />;
    case "search":
      return <SearchPanel />;
    case "selected":
      return <SelectedPanel tab={panel.tab} />;
    case "room":
      return <RoomPanel />;
    case "surfaces":
      return <SurfacesPanel />;
    case "openings":
      return <OpeningsPanel type={panel.type} />;
    case "style":
      return <StylePanel />;
    case "tops":
      return <TopsPanel />;
    case "lights":
      return <LightsPanel />;
    case "list":
      return <ListPanel />;
  }
}
