"use client";

import { useEffect, useMemo, useState } from "react";
import { addProduct, clearTops, setLighting, setTops } from "@/lib/planner/actions";
import {
  byId, LIGHT_COLORS, LIGHT_ZONES, SPLASHES, TOP_CATEGORIES, TOP_EDGES, TOP_THICKNESSES, WORKTOPS, type TopCategory,
} from "@/lib/planner/finishes";
import { findRun, resolveTop, worktopRuns } from "@/lib/planner/geometry";
import { ledStrips, stripTotals } from "@/lib/planner/lighting";
import { setUI, usePlanner } from "@/lib/planner/store";
import { PanelShell } from "./panels";
import { Chip, Icon, SectionTitle, Swatch, topSwatchStyle } from "./ui";

const m = (mm: number) => `${(mm / 1000).toFixed(2).replace(/\.?0+$/, "")} m`;

export function TopsPanel() {
  const d = usePlanner((s) => s.design);
  const sel = usePlanner((s) => s.ui.sel);
  const runs = useMemo(() => worktopRuns(d), [d]);
  const run = sel?.type === "top" ? findRun(runs, sel.id) : undefined;
  const spec = run ? run.spec : resolveTop(d.style);
  const current = byId(WORKTOPS, spec.material);
  const [cat, setCat] = useState<TopCategory>(current.category);
  // Follow the material when the scope or the chosen top changes.
  const scopeKey = run?.ref ?? "kitchen";
  useEffect(() => setCat(current.category), [scopeKey, current.category]);
  const set = (patch: Parameters<typeof setTops>[0]) => setTops(patch, run?.ids);
  const customised = d.items.filter((i) => i.top && Object.keys(i.top).length).length;
  const totalLen = runs.reduce((s, r) => s + r.len, 0);
  const area = runs.reduce((s, r) => s + (r.len * r.depth) / 1e6, 0);

  return (
    <PanelShell
      title="Pantry tops"
      crumbs={run ? `This section · ${m(run.len)} long` : runs.length ? `Whole kitchen · ${runs.length} section${runs.length === 1 ? "" : "s"}, ${m(totalLen)}` : "Kitchen default"}
    >
      {runs.length > 1 && (
        <div className="mb-4 grid grid-cols-2 border border-line p-0.5" role="group" aria-label="Apply to">
          <button type="button" aria-pressed={!run} onClick={() => setUI({ sel: null })} className={`h-9 text-[13px] font-semibold ${!run ? "bg-navy text-ivory" : "hover:bg-stone"}`}>Whole kitchen</button>
          <button type="button" aria-pressed={!!run} disabled={!run} onClick={() => undefined} className={`h-9 text-[13px] font-semibold disabled:text-muted ${run ? "bg-navy text-ivory" : ""}`}>This section</button>
        </div>
      )}
      {!runs.length && <p className="mb-4 bg-ivory p-3 text-[13px] text-ink-2">Worktops are created automatically over base cabinets. Choose the top you want here, then add base cabinets.</p>}
      {runs.length > 1 && !run && <p className="mb-4 text-[12.5px] text-muted">Tip: click any worktop in the room to give that section its own top — e.g. a granite island with a Staron main run.</p>}

      <SectionTitle>Material</SectionTitle>
      <div className="mb-2 flex flex-wrap gap-1.5" role="tablist" aria-label="Material type">
        {TOP_CATEGORIES.map((c) => <Chip key={c.id} active={cat === c.id} onClick={() => setCat(c.id)}>{c.id}</Chip>)}
      </div>
      <p className="mb-3 text-[12.5px] text-muted">{TOP_CATEGORIES.find((c) => c.id === cat)?.desc}</p>
      <div className="grid grid-cols-3 gap-x-2 gap-y-3">
        {WORKTOPS.filter((w) => w.category === cat).map((w) => (
          <Swatch key={w.id} label={w.name} style={topSwatchStyle(w)} active={spec.material === w.id} onClick={() => set({ material: w.id, thickness: w.thick })} />
        ))}
      </div>

      <SectionTitle>Thickness</SectionTitle>
      <div className="flex flex-wrap gap-1.5">
        {TOP_THICKNESSES.map((t) => <Chip key={t} active={spec.thickness === t} onClick={() => set({ thickness: t })}>{t} mm</Chip>)}
      </div>
      {spec.thickness <= 12 && <p className="mt-2 text-[12px] text-muted">Thin tops usually need a support board underneath; we&apos;ll confirm with you.</p>}

      <SectionTitle>Front edge</SectionTitle>
      <div className="grid grid-cols-4 gap-1.5">
        {TOP_EDGES.map((e) => (
          <button key={e.id} type="button" aria-pressed={spec.edge === e.id} onClick={() => set({ edge: e.id })} className={`flex flex-col items-center gap-1 border px-1 py-2 text-[11.5px] ${spec.edge === e.id ? "border-[#2f7be0] bg-[#eaf2fc]" : "border-line hover:border-navy"}`}>
            <svg viewBox="0 0 32 26" className="h-6 w-8" aria-hidden="true"><path d={e.path} fill="#d9d3c8" stroke="#1c334d" strokeWidth="1.5" /></svg>
            {e.name}
          </button>
        ))}
      </div>

      <SectionTitle>Backsplash</SectionTitle>
      <div className="flex flex-col gap-1.5">
        {SPLASHES.map((s) => (
          <button key={s.id} type="button" aria-pressed={spec.splash === s.id} onClick={() => set({ splash: s.id })} className={`flex items-center justify-between border px-3 py-2 text-left ${spec.splash === s.id ? "border-[#2f7be0] bg-[#eaf2fc]" : "border-line hover:border-navy"}`}>
            <span>
              <span className="block text-[13px] font-semibold">{s.name}</span>
              <span className="block text-[12px] text-muted">{s.desc}</span>
            </span>
            {spec.splash === s.id && <Icon name="check" size={16} className="text-[#2f7be0]" />}
          </button>
        ))}
      </div>
      {run && run.wall === null && spec.splash !== "none" && <p className="mt-2 text-[12px] text-muted">This section isn&apos;t against a wall, so it has no backsplash.</p>}

      <div className="mt-6 border-t border-line pt-4 text-[13px] text-ink-2">
        <p><strong className="text-navy">{current.name}</strong>, {spec.thickness} mm, {TOP_EDGES.find((e) => e.id === spec.edge)?.name.toLowerCase()} edge</p>
        {runs.length > 0 && <p className="text-[12.5px] text-muted">Kitchen total: {m(totalLen)} of worktop, {area.toFixed(2)} m²</p>}
      </div>
      {run && run.ids.some((id) => d.items.find((i) => i.id === id)?.top) && (
        <button type="button" onClick={() => clearTops(run.ids)} className="btn btn-outline mt-4 !min-h-10 w-full !text-[13px]">Use the kitchen&apos;s top for this section</button>
      )}
      {!run && customised > 0 && (
        <button type="button" onClick={() => clearTops()} className="btn btn-outline mt-4 !min-h-10 w-full !text-[13px]">Apply this top to every section</button>
      )}
    </PanelShell>
  );
}

export function LightsPanel() {
  const d = usePlanner((s) => s.design);
  const L = d.lighting;
  const totals = useMemo(() => stripTotals(d), [d]);
  const strips = useMemo(() => ledStrips(d), [d]);
  // How many metres each zone would add if switched on, so the toggle shows what it means for this kitchen.
  const potential = useMemo(() => {
    const all = ledStrips({ ...d, lighting: { ...L, zones: { under: true, plinth: true, glass: true, cove: true, shelf: true } }, items: d.items.map((i) => ({ ...i, light: undefined })) });
    const out: Record<string, number> = {};
    for (const s of all) out[s.zone] = (out[s.zone] ?? 0) + s.len;
    return out;
  }, [d, L]);
  const total = strips.reduce((s, x) => s + x.len, 0);
  return (
    <PanelShell title="Lights" crumbs={total ? `${m(total)} of LED strip in this design` : "LED strips and lamps"}>
      <SectionTitle>Preview</SectionTitle>
      <div className="grid grid-cols-2 gap-2">
        {([["day", "sun", "Daylight"], ["evening", "moon", "Evening"]] as const).map(([id, icon, label]) => (
          <button key={id} type="button" aria-pressed={L.mode === id} onClick={() => setLighting({ mode: id })} className={`flex h-12 items-center justify-center gap-2 border text-[13.5px] font-semibold ${L.mode === id ? "border-navy bg-navy text-ivory" : "border-line hover:border-navy"}`}>
            <Icon name={icon} size={18} /> {label}
          </button>
        ))}
      </div>
      <p className="mt-2 text-[12px] text-muted">Evening dims the daylight so you can see how the strips and lamps light the room.</p>

      <SectionTitle>LED strip zones</SectionTitle>
      <ul className="flex flex-col divide-y divide-line border-y border-line">
        {LIGHT_ZONES.map((z) => {
          const len = potential[z.id] ?? 0;
          return (
            <li key={z.id}>
              <label className={`flex cursor-pointer items-center gap-3 py-2.5 ${len ? "" : "opacity-50"}`}>
                <span className="min-w-0 flex-1">
                  <span className="block text-[13.5px] font-semibold">{z.name}</span>
                  <span className="block text-[12px] text-muted">{z.desc}{len ? ` · ${m(len)}` : " · nothing to light yet"}</span>
                </span>
                <input type="checkbox" checked={L.zones[z.id]} onChange={(e) => setLighting({ zones: { ...L.zones, [z.id]: e.target.checked } })} className="h-5 w-5 accent-[#2f7be0]" />
              </label>
            </li>
          );
        })}
      </ul>

      <SectionTitle>Light colour</SectionTitle>
      <div className="grid grid-cols-4 gap-x-2 gap-y-3">
        {LIGHT_COLORS.map((c) => (
          <Swatch key={c.id} label={`${c.name}${c.sub === "RGB" ? "" : ` ${c.sub}`}`} active={L.color === c.id} onClick={() => setLighting({ color: c.id })}
            style={{ background: `radial-gradient(circle at 50% 60%, ${c.hex} 0 35%, ${c.hex}55 60%, #2a2d33 100%)` }} />
        ))}
      </div>
      <p className="mt-2 text-[12px] text-muted">RGB colours need an RGB strip and controller — we&apos;ll include them in your quotation.</p>

      <SectionTitle>Brightness</SectionTitle>
      <label className="flex items-center gap-3">
        <Icon name="bulb" size={16} className="text-muted" />
        <input type="range" min={20} max={150} step={5} value={Math.round(L.brightness * 100)} onChange={(e) => setLighting({ brightness: Number(e.target.value) / 100 })} aria-label="Brightness" className="flex-1 accent-[#2f7be0]" />
        <span className="w-11 text-right text-[13px] tabular-nums">{Math.round(L.brightness * 100)}%</span>
      </label>

      <SectionTitle>Add lights</SectionTitle>
      <div className="grid grid-cols-3 gap-1.5">
        {[["led-strip", "LED strip"], ["downlight", "Downlight"], ["pendant", "Pendant"]].map(([id, label]) => (
          <button key={id} type="button" onClick={() => addProduct(id)} className="btn btn-outline !min-h-10 !px-2 !text-[12.5px]">+ {label}</button>
        ))}
      </div>
      <p className="mt-3 text-[12px] leading-relaxed text-muted">Select any cabinet to switch its own strip on or off. Add an LED strip to light a niche, shelf or anywhere else on a wall.</p>
      {totals.length > 0 && (
        <ul className="mt-4 border-t border-line pt-3 text-[12.5px] text-ink-2">
          {totals.map((t) => <li key={t.zone} className="flex justify-between py-0.5"><span>{t.name}</span><span className="tabular-nums">{t.metres} m</span></li>)}
        </ul>
      )}
    </PanelShell>
  );
}
