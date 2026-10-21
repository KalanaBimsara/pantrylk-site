"use client";

import { useEffect, useState, type ReactNode } from "react";
import type { Front } from "@/lib/planner/finishes";

const paths: Record<string, ReactNode> = {
  room: <path d="M4 4h16v16H4zM4 12h7v8" />,
  openings: <path d="M5 3h14v18H5zM5 12h14M12 3v18" />,
  elements: <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9zM12 12l8-4.5M12 12v9M12 12L4 7.5" />,
  surfaces: <path d="M4 20h16M6 20V9l6-5 6 5v11M10 20v-6h4v6" />,
  cabinets: <path d="M5 3h14v18H5zM5 10h14M10 6.5h4M10 14h4" />,
  appliances: <path d="M5 3h14v18H5zM5 8h14M8 5.5h.01M11 5.5h.01M12 14.5m-4 0a4 4 0 1 0 8 0a4 4 0 1 0-8 0" />,
  dining: <path d="M7 3v8M5 3v4a2 2 0 0 0 4 0V3M7 11v10M17 3c-2 0-3 2.5-3 6h3v12" />,
  extras: <path d="M9 3h6l1 4H8zM12 7v4M6 21l2-10h8l2 10z" />,
  search: <path d="M11 11m-7 0a7 7 0 1 0 14 0a7 7 0 1 0-14 0M21 21l-5-5" />,
  style: <path d="M12 3a9 9 0 1 0 0 18c1.5 0 2-1 2-2s-1-1.5-1-2.5S14 15 15 15h2a4 4 0 0 0 4-4c0-4.4-4-8-9-8zM7.5 11h.01M10 7h.01M15 7.5h.01" />,
  camera: <path d="M4 7h4l2-3h4l2 3h4v13H4zM12 13.5m-3.5 0a3.5 3.5 0 1 0 7 0a3.5 3.5 0 1 0-7 0" />,
  list: <path d="M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01" />,
  undo: <path d="M9 14L4 9l5-5M4 9h11a5 5 0 0 1 0 10h-3" />,
  redo: <path d="M15 14l5-5-5-5M20 9H9a5 5 0 0 0 0 10h3" />,
  save: <path d="M5 3h11l3 3v15H5zM8 3v5h7V3M8 21v-7h8v7" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  help: <path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0-18 0M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.6M12 17h.01" />,
  sliders: <path d="M4 7h10M18 7h2M4 17h4M12 17h8M16 5v4M10 15v4" />,
  modify: <path d="M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4" />,
  replace: <path d="M4 8h13l-3-3M20 16H7l3 3" />,
  door: <path d="M6 3h12v18H6zM14 12h.01M6 3l6 2v16" />,
  zoom: <path d="M11 11m-7 0a7 7 0 1 0 14 0a7 7 0 1 0-14 0M21 21l-5-5M8 11h6M11 8v6" />,
  position: <path d="M3 9v6M21 9v6M3 12h18M7 9l-4 3 4 3M17 9l4 3-4 3" />,
  duplicate: <path d="M8 8h12v12H8zM4 16V4h12" />,
  trash: <path d="M4 7h16M10 11v6M14 11v6M6 7l1 14h10l1-14M9 7V4h6v3" />,
  rotate: <path d="M20 12a8 8 0 1 1-2.3-5.7M20 4v5h-5" />,
  flip: <path d="M12 3v18M8 7l-4 5 4 5zM16 7l4 5-4 5z" />,
  floor: <path d="M3 8l9-5 9 5-9 5zM3 8v8l9 5 9-5V8" />,
  wall: <path d="M3 5h18v14H3zM3 12h18M9 5v7M15 12v7" />,
  cube: <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9zM12 12l8-4.5M12 12v9M12 12L4 7.5" />,
  walk: <path d="M13 4m-2 0a2 2 0 1 0 4 0a2 2 0 1 0-4 0M9 21l2-6 3 3v3M8 11l3-3 3 1 2 3M11 8l-1 7" />,
  share: <path d="M18 5m-3 0a3 3 0 1 0 6 0a3 3 0 1 0-6 0M6 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0-6 0M18 19m-3 0a3 3 0 1 0 6 0a3 3 0 1 0-6 0M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" />,
  print: <path d="M6 9V3h12v6M6 18H4v-8h16v8h-2M6 14h12v7H6z" />,
  download: <path d="M12 4v11M7 10l5 5 5-5M5 20h14" />,
  check: <path d="M5 12l5 5L20 7" />,
  warn: <path d="M12 3l10 18H2zM12 10v5M12 18h.01" />,
  info: <path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0-18 0M12 11v6M12 7.5h.01" />,
  chevron: <path d="M9 6l6 6-6 6" />,
  back: <path d="M15 6l-6 6 6 6" />,
  folder: <path d="M3 6h7l2 2h9v11H3z" />,
  file: <path d="M6 3h8l5 5v13H6zM14 3v5h5" />,
};

export function Icon({ name, size = 20, className = "" }: { name: keyof typeof paths | string; size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      {paths[name]}
    </svg>
  );
}

export function NumberField({ label, value, onChange, min, max, step = 10, suffix = "mm", disabled }: {
  label: string; value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number; suffix?: string; disabled?: boolean;
}) {
  const [text, setText] = useState(String(Math.round(value)));
  useEffect(() => setText(String(Math.round(value))), [value]);
  const commit = () => {
    const n = Number(text);
    if (!Number.isFinite(n)) return setText(String(Math.round(value)));
    const v = Math.min(max ?? Infinity, Math.max(min ?? -Infinity, n));
    setText(String(Math.round(v)));
    if (v !== value) onChange(v);
  };
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[12.5px] font-semibold text-ink-2">{label}</span>
      <span className="flex h-10 items-center border border-[#b9b2a6] bg-white focus-within:border-navy">
        <input
          type="number"
          inputMode="numeric"
          value={text}
          step={step}
          min={min}
          max={max}
          disabled={disabled}
          onChange={(e) => setText(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => e.key === "Enter" && (e.currentTarget as HTMLInputElement).blur()}
          className="h-full w-full min-w-0 bg-transparent px-2.5 text-[14.5px] tabular-nums outline-none disabled:text-muted"
        />
        {suffix && <span className="pr-2.5 text-[12px] text-muted">{suffix}</span>}
      </span>
    </label>
  );
}

export function frontSwatchStyle(f: Front): React.CSSProperties {
  if (f.surface === "wood") return { background: `repeating-linear-gradient(92deg, ${f.color} 0 5px, ${f.grain} 5px 6px, ${f.color} 6px 11px)` };
  if (f.rough < 0.3) return { background: `linear-gradient(135deg, #ffffff66, transparent 45%), ${f.color}` };
  return { background: f.color };
}

export function Swatch({ style, active, label, onClick, shaker }: { style: React.CSSProperties; active: boolean; label: string; onClick: () => void; shaker?: boolean }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={active} className="group flex flex-col items-center gap-1.5 text-center">
      <span
        className={`relative block h-14 w-full rounded-[2px] ring-1 ring-black/10 ${active ? "outline-2 outline-offset-2 outline-[#2f7be0]" : "group-hover:outline group-hover:outline-1 group-hover:outline-offset-2 group-hover:outline-navy/40"}`}
        style={style}
      >
        {shaker && <span className="absolute inset-2 ring-1 ring-black/15" />}
        {active && (
          <span className="absolute -bottom-2 -right-2 grid h-5 w-5 place-items-center rounded-full bg-[#2f7be0] text-white">
            <Icon name="check" size={12} />
          </span>
        )}
      </span>
      <span className="text-[11.5px] leading-tight text-ink-2">{label}</span>
    </button>
  );
}

export function Chip({ active, children, onClick }: { active: boolean; children: ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`h-8 min-w-12 rounded-full border px-3 text-[13px] font-semibold tabular-nums transition-colors ${active ? "border-navy bg-navy text-ivory" : "border-line bg-white hover:border-navy"}`}
    >
      {children}
    </button>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <h3 className="mb-3 mt-6 text-[12px] font-bold uppercase tracking-[0.12em] text-gold-deep first:mt-0">{children}</h3>;
}

export const mmLabel = (mm: number) => `${Math.round(mm / 10)} cm`;
