"use client";

import { useState } from "react";

type Row = { k: string; a: string; b: string };
const withKeys = (pairs: [string, string][]): Row[] => pairs.map(([a, b]) => ({ k: crypto.randomUUID(), a, b }));

function PairList({
  name,
  label,
  hint,
  initial,
  aLabel,
  bLabel,
  bType = "text",
  addLabel,
  serialize,
}: {
  name: string;
  label: string;
  hint?: React.ReactNode;
  initial: [string, string][];
  aLabel: string;
  bLabel: string;
  bType?: "text" | "color";
  addLabel: string;
  serialize: (rows: Row[]) => unknown[];
}) {
  const [rows, setRows] = useState<Row[]>(() => withKeys(initial));
  const update = (k: string, patch: Partial<Row>) => setRows((l) => l.map((r) => (r.k === k ? { ...r, ...patch } : r)));

  return (
    <div>
      <p className="field-label">{label}</p>
      {hint && <p className="-mt-1 mb-3 text-[13px] text-muted">{hint}</p>}
      <input type="hidden" name={name} value={JSON.stringify(serialize(rows))} />
      {rows.length > 0 && (
        <ul className="mb-3 flex flex-col gap-2">
          {rows.map((r, i) => (
            <li key={r.k} className="grid grid-cols-[1fr_1fr_auto] items-center gap-2">
              <input aria-label={`${aLabel} ${i + 1}`} placeholder={aLabel} value={r.a} onChange={(e) => update(r.k, { a: e.target.value })} className="field min-h-10 text-[15px]" />
              {bType === "color" ? (
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    aria-label={`${bLabel} ${i + 1} picker`}
                    value={/^#[0-9a-f]{6}$/i.test(r.b) ? r.b : "#000000"}
                    onChange={(e) => update(r.k, { b: e.target.value })}
                    className="h-10 w-12 shrink-0 cursor-pointer border border-[#b9b2a6] bg-white p-1"
                  />
                  <input aria-label={`${bLabel} ${i + 1}`} placeholder="#624734" value={r.b} onChange={(e) => update(r.k, { b: e.target.value })} className="field min-h-10 font-mono text-[14px]" />
                </div>
              ) : (
                <input aria-label={`${bLabel} ${i + 1}`} placeholder={bLabel} value={r.b} onChange={(e) => update(r.k, { b: e.target.value })} className="field min-h-10 text-[15px]" />
              )}
              <button type="button" onClick={() => setRows((l) => l.filter((x) => x.k !== r.k))} className="px-2 text-[14px] font-semibold text-error underline" aria-label={`Remove row ${i + 1}`}>
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
      <button type="button" onClick={() => setRows((l) => [...l, ...withKeys([["", bType === "color" ? "#" : ""]])])} className="btn btn-outline min-h-10 px-4 text-[14px]">
        {addLabel}
      </button>
    </div>
  );
}

/** Label / value rows (product specs, project materials). Empty rows are dropped. */
export function RowsField({ name, label, hint, initial }: { name: string; label: string; hint?: React.ReactNode; initial: { label: string; value: string }[] }) {
  return (
    <PairList
      name={name}
      label={label}
      hint={hint}
      initial={initial.map((r) => [r.label, r.value])}
      aLabel="Label"
      bLabel="Value"
      addLabel="Add row"
      serialize={(rows) => rows.filter((r) => r.a.trim() || r.b.trim()).map((r) => ({ label: r.a.trim(), value: r.b.trim() }))}
    />
  );
}

/** Finish swatches: name + hex colour. */
export function FinishesField({ name, label, hint, initial }: { name: string; label: string; hint?: React.ReactNode; initial: { name: string; hex: string }[] }) {
  return (
    <PairList
      name={name}
      label={label}
      hint={hint}
      initial={initial.map((f) => [f.name, f.hex])}
      aLabel="Finish name"
      bLabel="Colour"
      bType="color"
      addLabel="Add finish"
      serialize={(rows) => rows.filter((r) => r.a.trim() || r.b.replace("#", "").trim()).map((r) => ({ name: r.a.trim(), hex: r.b.trim() }))}
    />
  );
}
