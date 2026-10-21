"use client";

import { useMemo, useState } from "react";
import { getProduct } from "@/lib/planner/catalog";
import { itemDims, itemOnWall, roomArea, roomWalls } from "@/lib/planner/geometry";
import { designSummary, estimate, partsList, reviewDesign } from "@/lib/planner/review";
import { download, fileSlug, saveFile, shareLink } from "@/lib/planner/share";
import { command, setUI, toast, update, usePlanner } from "@/lib/planner/store";
import { Elevation, FloorPlan } from "./Plans";
import { Icon } from "./ui";

const lkr = new Intl.NumberFormat("en-LK", { maximumFractionDigits: 0 });

export type ContactProps = { whatsappNumber: string; quoteHref: string; quoteExternal: boolean; newTab: boolean };

export default function Review({ contact }: { contact: ContactProps }) {
  const d = usePlanner((s) => s.design);
  const snapshot = usePlanner((s) => s.ui.snapshot);
  const findings = useMemo(() => reviewDesign(d), [d]);
  const lines = useMemo(() => partsList(d), [d]);
  const total = estimate(lines);
  const walls = roomWalls(d.room.shape);
  const usedWalls = walls.filter((w) => d.openings.some((o) => o.wall === w.i) || d.items.some((it) => {
    const p = getProduct(it.product);
    return p && itemOnWall(it, itemDims(it, p, d.room).d, [w]);
  }));
  const [zoom, setZoom] = useState<number | "plan" | null>(null);
  const [busy, setBusy] = useState(false);
  const errors = findings.filter((f) => f.level === "error").length;

  const goFix = (id?: string) => {
    setUI({ step: 2, view: "3d", ...(id ? { sel: { type: "item", id }, panel: { kind: "selected", tab: "position" } } : {}) });
    if (id) setTimeout(() => command("focus", id), 50);
  };
  const share = async () => {
    const link = await shareLink(d);
    try {
      await navigator.clipboard.writeText(link);
      toast("Design link copied — anyone with the link can open a copy.");
    } catch {
      window.prompt("Copy this link to share your design:", link);
    }
  };
  const send = async () => {
    setBusy(true);
    const link = await shareLink(d);
    const text = designSummary(d, link);
    setBusy(false);
    window.open(`https://wa.me/${contact.whatsappNumber.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="print-flow absolute inset-0 overflow-y-auto bg-ivory">
      <div className="mx-auto grid max-w-[1320px] gap-6 p-4 md:p-6 lg:grid-cols-[1fr_340px]">
        <div className="flex min-w-0 flex-col gap-6">
          <section className="grid gap-4 border border-line bg-white p-4 md:grid-cols-[1.3fr_1fr]">
            <div className="grid aspect-[4/3] place-items-center overflow-hidden bg-[#f1efea]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {snapshot ? <img src={snapshot} alt="3D view of your kitchen design" className="h-full w-full object-cover" /> : <p className="text-[13px] text-muted">3D preview</p>}
            </div>
            <div className="flex flex-col gap-3 p-1">
              <div className="flex items-center gap-2.5">
                <span className={`grid h-9 w-9 place-items-center rounded-full ${errors ? "bg-[#fbe9e6] text-error" : "bg-[#e7f1ea] text-success"}`}>
                  <Icon name={errors ? "warn" : "check"} size={19} />
                </span>
                <h2 className="text-[17px] font-bold">{errors ? `${errors} thing${errors === 1 ? "" : "s"} to fix` : "Looks good!"}</h2>
              </div>
              <p className="text-[13.5px] text-ink-2">{errors ? "Our design check found items that need attention before we can quote." : "Your design passed our checks. Review the plans, then send it to our team."}</p>
              <ul className="flex flex-col gap-1.5">
                {findings.map((f, k) => (
                  <li key={k} className="flex items-start gap-2 text-[13px]">
                    <Icon name={f.level === "error" ? "warn" : f.level === "warning" ? "warn" : "info"} size={16} className={`mt-0.5 shrink-0 ${f.level === "error" ? "text-error" : f.level === "warning" ? "text-gold-deep" : "text-muted"}`} />
                    <span className="flex-1">{f.text}</span>
                    {f.itemId && <button type="button" onClick={() => goFix(f.itemId)} className="no-print shrink-0 text-[12.5px] font-semibold text-[#2f7be0] hover:underline">Fix</button>}
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-[16px] font-bold">2D plans & elevations</h2>
            <div className="grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(240px,1fr))]">
              <button type="button" onClick={() => setZoom("plan")} className="flex flex-col border border-line bg-white p-2 text-left hover:border-navy">
                <FloorPlan d={d} className="aspect-[4/3] w-full" />
                <span className="px-1 pt-2 text-[13px] font-semibold">Floor plan</span>
              </button>
              {usedWalls.map((w) => (
                <button key={w.i} type="button" onClick={() => setZoom(w.i)} className="flex flex-col border border-line bg-white p-2 text-left hover:border-navy">
                  <Elevation d={d} wall={w.i} className="aspect-[4/3] w-full" />
                  <span className="px-1 pt-2 text-[13px] font-semibold">Wall {w.i + 1} elevation</span>
                </button>
              ))}
            </div>
          </section>

          <section className="border border-line bg-white">
            <h2 className="border-b border-line px-4 py-3 text-[16px] font-bold">Item list</h2>
            <table className="w-full text-[13.5px]">
              <thead className="text-left text-[12px] uppercase tracking-[0.08em] text-muted">
                <tr><th className="px-4 py-2 font-semibold">Qty</th><th className="py-2 font-semibold">Item</th><th className="hidden py-2 font-semibold sm:table-cell">Code</th><th className="px-4 py-2 text-right font-semibold">{total != null ? "Price" : ""}</th></tr>
              </thead>
              <tbody className="divide-y divide-line">
                {lines.map((l) => (
                  <tr key={l.key}>
                    <td className="px-4 py-2.5 font-bold tabular-nums">{l.qty}</td>
                    <td className="py-2.5"><span className="font-semibold">{l.name}</span><span className="block text-[12px] text-muted">{l.detail}</span></td>
                    <td className="hidden py-2.5 tabular-nums text-ink-2 sm:table-cell">{l.code}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{l.price != null ? `LKR ${lkr.format(l.price * l.qty)}` : ""}</td>
                  </tr>
                ))}
                {!lines.length && <tr><td colSpan={4} className="px-4 py-6 text-center text-muted">No items yet — go to “Make it yours” to add cabinets.</td></tr>}
              </tbody>
            </table>
          </section>

          <section className="border border-line bg-white p-4">
            <label htmlFor="planner-notes" className="mb-2 block text-[16px] font-bold">Notes for our designers</label>
            <textarea id="planner-notes" value={d.notes} maxLength={2000} onChange={(e) => update((x) => ({ ...x, notes: e.target.value }), false)} placeholder="Anything we should know — budget, timeline, appliances you already own, plumbing that can't move…" className="field !min-h-[110px] text-[14px]" />
          </section>
        </div>

        <aside className="flex flex-col gap-4 self-start border border-line bg-white p-5 lg:sticky lg:top-6">
          <div>
            <p className="eyebrow">Your design</p>
            <h2 className="mt-1 text-[19px] font-bold">{d.name}</h2>
            <p className="mt-1 text-[13px] text-muted">{d.room.shape.width / 1000} × {d.room.shape.depth / 1000} m · {roomArea(d.room.shape).toFixed(1)} m² · {d.items.length} items</p>
          </div>
          <div className="border-y border-line py-3">
            {total != null ? (
              <p className="text-[13px] text-ink-2">Indicative total <span className="block text-[24px] font-bold text-navy">LKR {lkr.format(total)}</span></p>
            ) : (
              <p className="text-[13.5px] text-ink-2">Every Pantry LK kitchen is made to measure — send your design and we&apos;ll prepare a detailed quotation.</p>
            )}
          </div>
          <div className="no-print grid grid-cols-4 gap-1">
            {[
              { l: "Print", i: "print", f: () => window.print() },
              { l: "Share", i: "share", f: share },
              { l: "Save file", i: "save", f: () => saveFile(d) },
              { l: "Image", i: "download", f: () => snapshot && download(`${fileSlug(d.name)}.png`, snapshot) },
            ].map((b) => (
              <button key={b.l} type="button" onClick={b.f} className="flex flex-col items-center gap-1 py-2 text-[11.5px] text-ink-2 hover:bg-stone hover:text-navy">
                <Icon name={b.i} size={20} />
                {b.l}
              </button>
            ))}
          </div>
          <button type="button" onClick={send} disabled={busy} className="no-print btn btn-gold w-full">Send design to Pantry LK</button>
          <a href={contact.quoteHref} {...(contact.quoteExternal && contact.newTab ? { target: "_blank", rel: "noopener noreferrer" } : {})} className="no-print btn btn-outline w-full">Get a Quotation{contact.quoteExternal && " ↗"}</a>
          <p className="no-print text-[12px] leading-relaxed text-muted">Sending opens WhatsApp with your item list and a link to this design. Nothing is sent until you press send there.</p>
        </aside>
      </div>

      {zoom !== null && (
        <div className="no-print fixed inset-0 z-[80] flex items-center justify-center bg-navy-deep/70 p-4" role="dialog" aria-modal="true" aria-label="Plan preview" onClick={() => setZoom(null)}>
          <div className="relative max-h-full w-full max-w-[1100px] bg-white p-4" onClick={(e) => e.stopPropagation()}>
            <button type="button" onClick={() => setZoom(null)} aria-label="Close" className="absolute right-2 top-2 grid h-9 w-9 place-items-center hover:bg-stone"><Icon name="close" /></button>
            {zoom === "plan" ? <FloorPlan d={d} className="max-h-[80vh] w-full" /> : <Elevation d={d} wall={zoom} className="max-h-[80vh] w-full" />}
          </div>
        </div>
      )}

      {/* Print-only sheet: every plan at full width. */}
      <div className="print-only hidden">
        <FloorPlan d={d} className="w-full" />
        {usedWalls.map((w) => <Elevation key={w.i} d={d} wall={w.i} className="w-full" />)}
      </div>
    </div>
  );
}
