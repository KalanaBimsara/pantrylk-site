"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { duplicateItem, removeSelection, rotateItem, setCeiling, setLighting, setLocked, startDesign, type Template } from "@/lib/planner/actions";
import { getProduct, MENUS } from "@/lib/planner/catalog";
import { itemDims, itemOnWall, roomWalls } from "@/lib/planner/geometry";
import { estimate, partsList } from "@/lib/planner/review";
import { decodeDesign, openFile, saveFile, shareLink } from "@/lib/planner/share";
import { command, getState, readLocked, readSaved, redo, replaceDesign, setUI, startAutosave, toast, undo, update, usePlanner } from "@/lib/planner/store";
import type { OpeningType, Product, RoomShape, View } from "@/lib/planner/types";
import Overlay from "./Overlay";
import { SelectionCard, SidePanel } from "./panels";
import Review, { type ContactProps } from "./Review";
import PlannerScene, { sceneApi } from "./three/Scene";
import { Icon, NumberField } from "./ui";

const lkr = new Intl.NumberFormat("en-LK", { maximumFractionDigits: 0 });
// Wait a few frames for the 3D view to settle; background tabs pause frames, so cap the wait.
const frames = (n: number) =>
  new Promise<void>((r) => {
    const tick = (k: number) => (k <= 0 ? r() : requestAnimationFrame(() => tick(k - 1)));
    tick(n);
    setTimeout(r, 300);
  });

async function goStep(step: 1 | 2 | 3) {
  const ui = getState().ui;
  if (step === 3) {
    setUI({ sel: null, panel: null, view: "3d" });
    await frames(4);
    setUI({ step: 3, snapshot: sceneApi.capture?.() ?? null });
    return;
  }
  setUI({ step, panel: null, sel: null, view: step === 2 && ui.view === "plan" ? "3d" : ui.step === 3 ? "3d" : ui.view });
}

// ---------------------------------------------------------------- top bar

const STEPS = [
  { n: 1, label: "Define your space" },
  { n: 2, label: "Make it yours" },
  { n: 3, label: "Make it happen" },
] as const;

function FileMenu({ onClose }: { onClose: () => void }) {
  const d = usePlanner((s) => s.design);
  const items = [
    { l: "Save design to file", i: "save", f: () => saveFile(d) },
    {
      l: "Open design file", i: "folder", f: async () => {
        const next = await openFile();
        if (next) {
          replaceDesign(next, true);
          setUI({ step: 2, view: "3d" });
          command("reset");
          toast(`Opened “${next.name}”.`);
        } else toast("That file isn't a Pantry LK design.");
      },
    },
    {
      l: "Copy share link", i: "share", f: async () => {
        const link = await shareLink(d);
        try {
          await navigator.clipboard.writeText(link);
          toast("Design link copied.");
        } catch {
          window.prompt("Copy this link:", link);
        }
      },
    },
    { l: "Start a new design", i: "file", f: () => setUI({ dialog: "start" }) },
  ];
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute right-0 top-full z-50 mt-1 w-56 border border-line bg-white py-1 shadow-[0_8px_28px_rgba(19,37,58,0.18)]" role="menu">
        {items.map((it) => (
          <button key={it.l} type="button" role="menuitem" onClick={() => { onClose(); it.f(); }} className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-[13.5px] hover:bg-ivory">
            <Icon name={it.i} size={18} /> {it.l}
          </button>
        ))}
      </div>
    </>
  );
}

function TopBar() {
  const step = usePlanner((s) => s.ui.step);
  const name = usePlanner((s) => s.design.name);
  const canUndo = usePlanner((s) => s.past.length > 0);
  const canRedo = usePlanner((s) => s.future.length > 0);
  const d = usePlanner((s) => s.design);
  const total = useMemo(() => estimate(partsList(d)), [d]);
  const [menu, setMenu] = useState(false);
  const ib = "grid h-10 w-10 place-items-center rounded-[2px] text-navy hover:bg-stone disabled:opacity-30 disabled:hover:bg-transparent";
  return (
    <header className="no-print flex h-14 shrink-0 items-center gap-2 border-b border-line bg-white px-3 md:gap-4 md:px-4">
      <Link href="/" aria-label="Pantry LK — back to the website" className="hidden shrink-0 sm:block">
        <Image src="/brand/logo.png" alt="" width={1152} height={422} className="h-8 w-auto" priority />
      </Link>
      <nav aria-label="Planner steps" className="flex min-w-[120px] flex-1 self-stretch overflow-x-auto [scrollbar-width:none]">
        {STEPS.map((s) => (
          <button
            key={s.n}
            type="button"
            onClick={() => goStep(s.n)}
            aria-current={step === s.n ? "step" : undefined}
            className={`flex shrink-0 items-center gap-2 border-b-[3px] px-2 text-[13.5px] font-semibold sm:px-3 md:px-4 ${step === s.n ? "border-gold text-navy" : "border-transparent text-muted hover:text-navy"}`}
          >
            <span className={`grid h-5 w-5 place-items-center rounded-full text-[11px] ${step === s.n ? "bg-navy text-ivory" : "bg-stone"}`}>{s.n}</span>
            <span className={step === s.n ? "hidden sm:inline" : "hidden lg:inline"}>{s.label}</span>
          </button>
        ))}
      </nav>
      <div className="flex shrink-0 items-center gap-0.5">
        <button type="button" className={ib} onClick={undo} disabled={!canUndo} aria-label="Undo" title="Undo (Ctrl+Z)"><Icon name="undo" /></button>
        <button type="button" className={`${ib} hidden sm:grid`} onClick={redo} disabled={!canRedo} aria-label="Redo" title="Redo (Ctrl+Y)"><Icon name="redo" /></button>
        <button type="button" className={`${ib} hidden sm:grid`} onClick={() => setUI((ui) => ({ panel: ui.panel?.kind === "list" ? null : { kind: "list" } }))} aria-label="Item list" title="Item list"><Icon name="list" /></button>
        <div className="relative">
          <button type="button" className={ib} onClick={() => setMenu((m) => !m)} aria-label="Save and share" aria-haspopup="menu" aria-expanded={menu} title="Save & share"><Icon name="save" /></button>
          {menu && <FileMenu onClose={() => setMenu(false)} />}
        </div>
        <button type="button" className={`${ib} hidden sm:grid`} onClick={() => setUI({ dialog: "tips" })} aria-label="Help" title="Help"><Icon name="help" /></button>
      </div>
      <div className="hidden min-w-0 flex-col items-end md:flex">
        <input
          value={name}
          maxLength={120}
          onChange={(e) => update((x) => ({ ...x, name: e.target.value }), false)}
          aria-label="Design name"
          className="w-48 truncate bg-transparent text-right text-[13px] font-semibold outline-none hover:underline focus:underline"
        />
        <span className="text-[12px] text-muted">{total ? `Est. LKR ${lkr.format(total.total)}${total.unpriced ? " + extras" : ""}` : `${d.items.length} item${d.items.length === 1 ? "" : "s"} · price on quotation`}</span>
      </div>
      {step < 3 && (
        <button type="button" onClick={() => goStep((step + 1) as 2 | 3)} className="btn btn-navy !min-h-10 !px-3 !text-[13.5px] sm:!px-4">
          Continue
        </button>
      )}
      <Link href="/" aria-label="Exit planner" title="Exit (your design is saved in this browser)" className={ib}><Icon name="close" /></Link>
    </header>
  );
}

// ---------------------------------------------------------------- toolbar

function ToolButton({ icon, label, active, onClick, caret }: { icon: string; label: string; active?: boolean; onClick: () => void; caret?: boolean }) {
  return (
    <button type="button" onClick={onClick} aria-expanded={caret ? active : undefined} className={`flex min-w-[64px] shrink-0 flex-col items-center gap-1 px-2 py-1.5 text-[11.5px] font-medium ${active ? "text-navy" : "text-ink-2 hover:text-navy"}`}>
      <span className={`grid h-9 w-9 place-items-center rounded-[2px] border ${active ? "border-navy bg-navy text-ivory" : "border-line bg-white"}`}>
        <Icon name={icon} size={19} />
      </span>
      <span className="whitespace-nowrap">{label}</span>
    </button>
  );
}

function Mega({ group, onPick }: { group: Product["group"]; onPick: (sub: string) => void }) {
  const menu = MENUS.find((m) => m.group === group)!;
  return (
    <div className="absolute left-2 top-full z-50 mt-1 flex max-w-[calc(100vw-16px)] flex-wrap gap-x-10 gap-y-4 border border-line bg-white p-5 shadow-[0_10px_32px_rgba(19,37,58,0.18)]" role="menu">
      {menu.sections.map((s) => (
        <div key={s.title} className="min-w-[160px]">
          <p className="mb-2 border-b border-line pb-2 text-[13.5px] font-bold">{s.title}</p>
          <ul>
            {s.subs.map((sub) => (
              <li key={sub}>
                <button type="button" role="menuitem" onClick={() => onPick(`${s.title}/${sub}`)} className="w-full py-1.5 text-left text-[13px] text-ink-2 hover:text-navy hover:underline">
                  {sub}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function SmallMenu({ items, onPick }: { items: { id: string; label: string }[]; onPick: (id: string) => void }) {
  return (
    <div className="absolute left-2 top-full z-50 mt-1 min-w-[180px] border border-line bg-white p-2 shadow-[0_10px_32px_rgba(19,37,58,0.18)]" role="menu">
      {items.map((i) => (
        <button key={i.id} type="button" role="menuitem" onClick={() => onPick(i.id)} className="block w-full px-3 py-2 text-left text-[13px] text-ink-2 hover:bg-ivory hover:text-navy">
          {i.label}
        </button>
      ))}
    </div>
  );
}

function Toolbar() {
  const step = usePlanner((s) => s.ui.step);
  const panel = usePlanner((s) => s.ui.panel);
  const ceiling = usePlanner((s) => s.design.room.ceiling);
  const [menu, setMenu] = useState<string | null>(null);
  const openPanel = (p: NonNullable<typeof panel>) => {
    setMenu(null);
    setUI((ui) => ({ panel: p, sel: p.kind === "openings" && ui.sel?.type === "opening" ? null : ui.sel }));
  };
  const toggle = (id: string) => setMenu((m) => (m === id ? null : id));
  const photo = () => {
    const url = sceneApi.capture?.();
    if (!url) return;
    const a = document.createElement("a");
    a.href = url;
    a.download = "pantrylk-kitchen.png";
    a.click();
    toast("Image saved to your downloads.");
  };
  const catalogMenus = MENUS.filter((m) => m.group !== "elements");
  return (
    <div className="no-print relative z-30 flex h-[70px] shrink-0 items-center border-b border-line bg-ivory">
      {menu && <div className="fixed inset-0 z-40" onClick={() => setMenu(null)} />}
      <div className="flex h-full min-w-0 flex-1 items-center gap-0.5 overflow-x-auto px-2 [scrollbar-width:thin]">
        {step === 1 ? (
          <>
            <ToolButton icon="room" label="Room shape" active={panel?.kind === "room"} onClick={() => openPanel({ kind: "room" })} />
            <ToolButton icon="openings" label="Openings" caret active={menu === "openings" || panel?.kind === "openings"} onClick={() => toggle("openings")} />
            <ToolButton icon="elements" label="Elements" caret active={menu === "elements" || panel?.kind === "catalog"} onClick={() => toggle("elements")} />
            <ToolButton icon="surfaces" label="Floor & walls" active={panel?.kind === "surfaces"} onClick={() => openPanel({ kind: "surfaces" })} />
            <ToolButton icon="search" label="Search" active={panel?.kind === "search"} onClick={() => openPanel({ kind: "search" })} />
            <span className="mx-2 h-10 w-px shrink-0 bg-line" />
            <div className="w-[130px] shrink-0">
              <NumberField label="Ceiling height" value={ceiling} min={2000} max={6000} onChange={setCeiling} />
            </div>
          </>
        ) : (
          <>
            {catalogMenus.map((m) => (
              <ToolButton key={m.group} icon={m.group} label={m.label} caret active={menu === m.group || (panel?.kind === "catalog" && panel.group === m.group)} onClick={() => toggle(m.group)} />
            ))}
            <ToolButton icon="search" label="Search" active={panel?.kind === "search"} onClick={() => openPanel({ kind: "search" })} />
            <span className="mx-2 h-10 w-px shrink-0 bg-line" />
            <ToolButton icon="style" label="Kitchen style" active={panel?.kind === "style"} onClick={() => openPanel({ kind: "style" })} />
            <ToolButton icon="top" label="Pantry tops" active={panel?.kind === "tops"} onClick={() => openPanel({ kind: "tops" })} />
            <ToolButton icon="bulb" label="Lights" active={panel?.kind === "lights"} onClick={() => openPanel({ kind: "lights" })} />
            <ToolButton icon="camera" label="Photo" onClick={photo} />
            <ToolButton icon="list" label="Item list" active={panel?.kind === "list"} onClick={() => openPanel({ kind: "list" })} />
          </>
        )}
      </div>
      {menu === "openings" && (
        <SmallMenu items={(["window", "door", "opening"] as OpeningType[]).map((t) => ({ id: t, label: t === "window" ? "Windows" : t === "door" ? "Doors" : "Wall openings" }))} onPick={(t) => openPanel({ kind: "openings", type: t as OpeningType })} />
      )}
      {menu === "elements" && (
        <SmallMenu items={MENUS.find((m) => m.group === "elements")!.sections[0].subs.map((s) => ({ id: s, label: s }))} onPick={(s) => openPanel({ kind: "catalog", group: "elements", sub: `Elements/${s}` })} />
      )}
      {menu && catalogMenus.some((m) => m.group === menu) && <Mega group={menu as Product["group"]} onPick={(sub) => openPanel({ kind: "catalog", group: menu as Product["group"], sub })} />}
    </div>
  );
}

// ---------------------------------------------------------------- canvas overlays

function ViewSwitcher() {
  const view = usePlanner((s) => s.ui.view);
  const locked = usePlanner((s) => s.ui.locked);
  const elevWall = usePlanner((s) => s.ui.elevWall);
  const shape = usePlanner((s) => s.design.room.shape);
  const count = roomWalls(shape).length;
  const pickWall = () => {
    const { ui, design } = getState();
    if (ui.sel?.type === "wall") return Number(ui.sel.id);
    if (ui.sel?.type === "item") {
      const it = design.items.find((i) => i.id === ui.sel!.id);
      const p = it && getProduct(it.product);
      const on = it && p && itemOnWall(it, itemDims(it, p, design.room).d, roomWalls(design.room.shape));
      if (on) return on.wall;
    }
    if (ui.sel?.type === "opening") return design.openings.find((o) => o.id === ui.sel!.id)?.wall ?? ui.elevWall;
    return ui.elevWall;
  };
  const views: { id: View; label: string; icon: string }[] = [
    { id: "plan", label: "Floor", icon: "floor" },
    { id: "elevation", label: "Wall", icon: "wall" },
    { id: "3d", label: "3D", icon: "cube" },
    { id: "walk", label: "Walk", icon: "walk" },
  ];
  return (
    <div className="no-print absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2">
      {view === "elevation" && (
        <div className="flex items-center border border-line bg-white shadow-sm">
          <button type="button" aria-label="Previous wall" className="grid h-10 w-9 place-items-center hover:bg-stone" onClick={() => setUI({ elevWall: (elevWall - 1 + count) % count })}><Icon name="back" size={16} /></button>
          <span className="px-1 text-[12.5px] font-semibold tabular-nums">Wall {elevWall + 1}</span>
          <button type="button" aria-label="Next wall" className="grid h-10 w-9 place-items-center hover:bg-stone" onClick={() => setUI({ elevWall: (elevWall + 1) % count })}><Icon name="chevron" size={16} /></button>
        </div>
      )}
      <button
        type="button"
        onClick={() => setLocked(!locked)}
        aria-pressed={locked}
        title={locked ? "Unlock the layout to move units again (L)" : "Lock the layout so units can't be moved by accident (L)"}
        className={`flex h-10 items-center gap-1.5 border px-3 text-[12.5px] font-semibold shadow-sm ${locked ? "border-gold bg-gold text-navy" : "border-line bg-white text-ink-2 hover:bg-stone"}`}
      >
        <Icon name={locked ? "lock" : "unlock"} size={17} />
        <span className="hidden sm:inline">{locked ? "Locked" : "Lock"}</span>
      </button>
      <div className="flex border border-line bg-white shadow-sm" role="group" aria-label="View">
        {views.map((v) => (
          <button
            key={v.id}
            type="button"
            aria-pressed={view === v.id}
            onClick={() => setUI(v.id === "elevation" ? { view: v.id, elevWall: Math.min(count - 1, pickWall()) } : { view: v.id })}
            className={`flex h-10 items-center gap-1.5 px-3 text-[12.5px] font-semibold ${view === v.id ? "bg-[#eaf2fc] text-[#1f5fae]" : "text-ink-2 hover:bg-stone"}`}
          >
            <Icon name={v.icon} size={17} />
            <span className="hidden sm:inline">{v.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function ZoomControls() {
  const evening = usePlanner((s) => s.design.lighting.mode === "evening");
  const showDims = usePlanner((s) => s.ui.showDims);
  const showWall = usePlanner((s) => s.ui.showWallUnits);
  const [open, setOpen] = useState(false);
  const b = "grid h-10 w-10 place-items-center border border-line bg-white text-navy shadow-sm hover:bg-stone";
  return (
    <div className="no-print absolute bottom-4 right-3 z-10 flex flex-col gap-1.5">
      <button type="button" className={b} aria-label={evening ? "Switch to daylight" : "Preview evening lighting"} title={evening ? "Daylight" : "Evening lighting"} aria-pressed={evening} onClick={() => setLighting({ mode: evening ? "day" : "evening" })}>
        <Icon name={evening ? "sun" : "moon"} size={18} />
      </button>
      <button type="button" className={b} aria-label="Zoom in" onClick={() => command("zoomIn")}><Icon name="plus" /></button>
      <button type="button" className={b} aria-label="Zoom out" onClick={() => command("zoomOut")}><Icon name="minus" /></button>
      <button type="button" className={b} aria-label="Reset view" title="Reset view" onClick={() => command("reset")}><Icon name="rotate" size={18} /></button>
      <div className="relative">
        <button type="button" className={b} aria-label="Display settings" aria-expanded={open} onClick={() => setOpen((o) => !o)}><Icon name="sliders" /></button>
        {open && (
          <div className="absolute bottom-0 right-12 w-56 border border-line bg-white p-3 shadow-[0_8px_28px_rgba(19,37,58,0.18)]">
            <p className="mb-2 text-[13px] font-bold">Display</p>
            {[
              { l: "Show measurements", v: showDims, f: () => setUI({ showDims: !showDims }) },
              { l: "Show wall cabinets", v: showWall, f: () => setUI({ showWallUnits: !showWall }) },
            ].map((t) => (
              <label key={t.l} className="flex cursor-pointer items-center justify-between py-1.5 text-[13px]">
                {t.l}
                <input type="checkbox" checked={t.v} onChange={t.f} className="h-4 w-4 accent-[#2f7be0]" />
              </label>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function WalkPad() {
  const view = usePlanner((s) => s.ui.view);
  if (view !== "walk") return null;
  const hold = (k: string) => ({
    onPointerDown: (e: React.PointerEvent) => { e.preventDefault(); sceneApi.walkKeys.add(k); sceneApi.invalidate?.(); },
    onPointerUp: () => sceneApi.walkKeys.delete(k),
    onPointerLeave: () => sceneApi.walkKeys.delete(k),
  });
  const b = "grid h-11 w-11 place-items-center border border-line bg-white/95 text-navy shadow-sm active:bg-stone";
  return (
    <div className="no-print absolute bottom-20 left-4 z-10 flex flex-col items-start gap-2">
      <p className="bg-white/90 px-2 py-1 text-[12px] text-ink-2 shadow-sm">Drag to look around · W A S D or arrows to move</p>
      <div className="grid grid-cols-3 gap-1">
        <span />
        <button type="button" aria-label="Walk forward" className={b} {...hold("w")}><Icon name="chevron" className="-rotate-90" /></button>
        <span />
        <button type="button" aria-label="Turn left" className={b} {...hold("arrowleft")}><Icon name="back" /></button>
        <button type="button" aria-label="Walk back" className={b} {...hold("s")}><Icon name="chevron" className="rotate-90" /></button>
        <button type="button" aria-label="Turn right" className={b} {...hold("arrowright")}><Icon name="chevron" /></button>
      </div>
    </div>
  );
}

function Toast() {
  const t = usePlanner((s) => s.ui.toast);
  if (!t) return null;
  return (
    <div role="status" className="no-print fade-in absolute bottom-20 left-1/2 z-30 max-w-[90%] -translate-x-1/2 bg-navy px-4 py-2.5 text-center text-[13.5px] text-ivory shadow-lg">
      {t}
    </div>
  );
}

// ---------------------------------------------------------------- dialogs

function Modal({ title, sub, children, onClose }: { title: string; sub?: string; children: React.ReactNode; onClose?: () => void }) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-navy-deep/55 p-4" role="dialog" aria-modal="true" aria-labelledby="pl-modal-t">
      <div className="fade-in relative max-h-full w-full max-w-[860px] overflow-y-auto bg-white shadow-2xl">
        <header className="flex items-start gap-4 border-b border-line px-6 py-4">
          <div className="flex-1">
            <h2 id="pl-modal-t" className="text-[19px] font-bold">{title}</h2>
            {sub && <p className="text-[13px] text-muted">{sub}</p>}
          </div>
          {onClose && <button type="button" onClick={onClose} aria-label="Close" className="grid h-9 w-9 place-items-center hover:bg-stone"><Icon name="close" /></button>}
        </header>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

const TEMPLATES: { id: Template; label: string; path: string }[] = [
  { id: "empty", label: "Empty room", path: "" },
  { id: "straight", label: "Single wall", path: "M6 6h36v8H6z" },
  { id: "l", label: "L-shaped", path: "M6 6h36v8H14v28H6z" },
  { id: "u", label: "U-shaped", path: "M6 6h36v36h-8V14H14v28H6z" },
  { id: "galley", label: "Galley", path: "M6 6h36v8H6zM6 34h36v8H6z" },
  { id: "island", label: "With island", path: "M6 6h36v8H14v28H6zM20 24h16v8H20z" },
];

function StartDialog() {
  const cur = usePlanner((s) => s.design.room.shape);
  const hasItems = usePlanner((s) => s.design.items.length > 0);
  const [kind, setKind] = useState<RoomShape["kind"]>(cur.kind);
  const [w, setW] = useState(cur.width);
  const [dd, setD] = useState(cur.depth);
  const [tpl, setTpl] = useState<Template>("empty");
  const shapes: { kind: RoomShape["kind"]; label: string; path: string }[] = [
    { kind: "rect", label: "Rectangle", path: "M4 4h56v56H4z" },
    { kind: "notch", label: "Notched corner", path: "M4 4h36v16h20v40H4z" },
    { kind: "angled", label: "Angled corner", path: "M4 4h38l18 18v38H4z" },
  ];
  const start = () => {
    const shape: RoomShape = kind === "rect" ? { kind, width: w, depth: dd } : kind === "notch" ? { kind, width: w, depth: dd, cutWidth: 1200, cutDepth: 1000 } : { kind, width: w, depth: dd, chamfer: 1000 };
    startDesign(shape, tpl);
  };
  return (
    <Modal title="Plan your Pantry LK kitchen" sub="Choose your room shape and a starting layout. You can change everything later." onClose={hasItems ? () => setUI({ dialog: null }) : undefined}>
      <p className="mb-3 text-[14px] font-bold">Room shape</p>
      <div className="grid grid-cols-3 gap-3">
        {shapes.map((s) => (
          <button key={s.kind} type="button" onClick={() => setKind(s.kind)} aria-pressed={kind === s.kind} className={`relative flex flex-col items-center gap-2 border-2 p-4 text-[13px] font-semibold ${kind === s.kind ? "border-[#2f7be0]" : "border-transparent ring-1 ring-line hover:ring-navy"}`}>
            <svg viewBox="0 0 64 64" className="h-16 w-16" aria-hidden="true"><path d={s.path} fill={kind === s.kind ? "#b7d0ee" : "#fff"} stroke="#1c334d" strokeWidth="2.5" /></svg>
            {s.label}
            {kind === s.kind && <span className="absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-full bg-[#2f7be0] text-white"><Icon name="check" size={14} /></span>}
          </button>
        ))}
      </div>
      <div className="mt-4 grid max-w-[360px] grid-cols-2 gap-3">
        <NumberField label="Room width" value={w} min={1500} max={20000} onChange={setW} />
        <NumberField label="Room depth" value={dd} min={1500} max={20000} onChange={setD} />
      </div>
      <p className="mb-3 mt-6 text-[14px] font-bold">Start with</p>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
        {TEMPLATES.map((t) => (
          <button key={t.id} type="button" onClick={() => setTpl(t.id)} aria-pressed={tpl === t.id} className={`flex flex-col items-center gap-2 border-2 p-3 text-[12.5px] font-semibold ${tpl === t.id ? "border-[#2f7be0]" : "border-transparent ring-1 ring-line hover:ring-navy"}`}>
            <svg viewBox="0 0 48 48" className="h-12 w-12" aria-hidden="true">
              <rect x="4" y="4" width="40" height="40" fill="#fff" stroke="#1c334d" strokeWidth="2" />
              {t.path && <path d={t.path} fill="#b19764" />}
            </svg>
            {t.label}
          </button>
        ))}
      </div>
      <div className="mt-7 flex justify-end">
        <button type="button" onClick={start} className="btn btn-navy">Start planning</button>
      </div>
    </Modal>
  );
}

function RecoverDialog() {
  const saved = useMemo(() => readSaved(), []);
  const mins = saved ? Math.max(1, Math.round((Date.now() - saved.at) / 60000)) : 0;
  const ago = mins < 60 ? `${mins} minute${mins === 1 ? "" : "s"}` : mins < 2880 ? `${Math.round(mins / 60)} hours` : `${Math.round(mins / 1440)} days`;
  return (
    <Modal title="Continue your design?" sub={saved ? `We found “${saved.design.name}” from ${ago} ago saved in this browser.` : undefined}>
      <div className="flex flex-wrap justify-end gap-3">
        <button type="button" className="btn btn-outline" onClick={() => setUI({ dialog: "start" })}>Start from scratch</button>
        <button
          type="button"
          className="btn btn-navy"
          onClick={() => {
            if (!saved) return setUI({ dialog: "start" });
            replaceDesign(saved.design);
            setUI({ dialog: null, step: saved.design.items.length ? 2 : 1, view: saved.design.items.length ? "3d" : "plan" });
            command("reset");
          }}
        >
          Continue design
        </button>
      </div>
    </Modal>
  );
}

function TipsDialog() {
  const tips = [
    ["Add items", "Pick a category in the toolbar, then click a product — it lines up along your walls automatically."],
    ["Move & snap", "Drag any item. It snaps flat against the nearest wall and lines up with its neighbours. A red outline means it doesn't fit there."],
    ["Look around", "Drag to orbit in 3D, right-drag (or two fingers) to pan, scroll or pinch to zoom. Try Floor, Wall and Walk views at the bottom."],
    ["Edit", "Select an item to modify its width, fronts and handle, replace it, open its doors or set an exact position."],
    ["Lock the layout", "Happy with the layout? Press the padlock (or L). Units can't be moved, so dragging anywhere just looks around — you can still change finishes, tops and lights."],
    ["Shortcuts", "R rotate · Delete remove · Ctrl+D duplicate · Ctrl+Z undo · Ctrl+Y redo · L lock · Esc deselect."],
    ["Saving", "Your design is saved in this browser as you work. Use Save & share to keep a file or send a link."],
  ];
  return (
    <Modal title="How the Kitchen Planner works" onClose={() => setUI({ dialog: null })}>
      <ul className="grid gap-4 sm:grid-cols-2">
        {tips.map(([t, d]) => (
          <li key={t} className="border-l-2 border-gold pl-3">
            <p className="text-[14px] font-bold">{t}</p>
            <p className="text-[13.5px] text-ink-2">{d}</p>
          </li>
        ))}
      </ul>
      <div className="mt-6 flex justify-end">
        <button type="button" className="btn btn-navy" onClick={() => setUI({ dialog: null })}>Got it</button>
      </div>
    </Modal>
  );
}

function Dialogs() {
  const dialog = usePlanner((s) => s.ui.dialog);
  if (dialog === "start") return <StartDialog />;
  if (dialog === "recover") return <RecoverDialog />;
  if (dialog === "tips") return <TipsDialog />;
  return null;
}

// ---------------------------------------------------------------- root

function useShortcuts() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (/INPUT|TEXTAREA|SELECT/.test(t.tagName) || t.isContentEditable) return;
      const { ui } = getState();
      const mod = e.ctrlKey || e.metaKey;
      const k = e.key.toLowerCase();
      if (mod && k === "z" && !e.shiftKey) { e.preventDefault(); undo(); }
      else if (mod && (k === "y" || (k === "z" && e.shiftKey))) { e.preventDefault(); redo(); }
      else if (mod && k === "s") { e.preventDefault(); saveFile(getState().design); }
      else if (ui.view === "walk") return;
      else if (mod && k === "d" && ui.sel?.type === "item") { e.preventDefault(); duplicateItem(ui.sel.id); }
      else if ((k === "delete" || k === "backspace") && ui.sel && ui.sel.type !== "wall") { e.preventDefault(); removeSelection(); }
      else if (k === "r" && !mod && ui.sel?.type === "item") rotateItem(ui.sel.id, e.shiftKey ? -1 : 1);
      else if (k === "l" && !mod) setLocked(!ui.locked);
      else if (k === "escape") setUI({ sel: null, panel: ui.sel ? ui.panel : null, dialog: ui.dialog === "tips" ? null : ui.dialog });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
}

export default function KitchenPlanner({ contact }: { contact: ContactProps }) {
  const step = usePlanner((s) => s.ui.step);
  const booted = useRef(false);
  useShortcuts();

  useEffect(() => {
    const html = document.documentElement;
    const prev = html.style.overflow;
    html.style.overflow = "hidden";
    const stop = startAutosave();
    setUI({ locked: readLocked() });
    if (!booted.current) {
      booted.current = true;
      (async () => {
        const m = location.hash.match(/#d=([\w-]+)/);
        if (m) {
          const shared = await decodeDesign(m[1]);
          history.replaceState(null, "", location.pathname);
          if (shared) {
            replaceDesign(shared);
            setUI({ step: 2, view: "3d", dialog: null });
            command("reset");
            toast("Shared design opened — your changes are saved as your own copy.");
            return;
          }
          toast("That design link couldn't be opened.");
        }
        setUI({ dialog: readSaved() ? "recover" : "start" });
      })();
    }
    return () => {
      html.style.overflow = prev;
      stop();
    };
  }, []);

  return (
    <div className="planner-root fixed inset-0 z-[60] flex flex-col bg-ivory text-navy">
      <h1 className="sr-only">Pantry LK Kitchen Planner</h1>
      <TopBar />
      {step < 3 && <Toolbar />}
      <div className="relative min-h-0 flex-1">
        <div className="no-print absolute inset-0">
          <PlannerScene />
        </div>
        {step < 3 ? (
          <>
            <Overlay />
            <SidePanel />
            <SelectionCard />
            <ViewSwitcher />
            <ZoomControls />
            <WalkPad />
          </>
        ) : (
          <Review contact={contact} />
        )}
        <Toast />
      </div>
      <Dialogs />
    </div>
  );
}
