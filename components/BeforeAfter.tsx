"use client";

import Image from "next/image";
import { useState } from "react";
import type { Img } from "@/lib/types";

export default function BeforeAfter({ before, after }: { before: Img; after: Img }) {
  const [split, setSplit] = useState(50);
  return (
    <div>
      <div className="relative aspect-[16/9] overflow-hidden bg-stone md:aspect-[16/7]">
        <Image src={after.src} alt={`After: ${after.alt}`} fill sizes="100vw" className="object-cover" />
        <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - split}% 0 0)` }}>
          <Image src={before.src} alt={`Before: ${before.alt}`} fill sizes="100vw" className="object-cover" />
        </div>
        <div aria-hidden="true" className="absolute inset-y-0 w-0.5 bg-white" style={{ left: `${split}%` }} />
        <span className="absolute bottom-4 left-4 bg-navy px-2.5 py-1.5 text-[12px] font-semibold uppercase tracking-[0.1em] text-white">Before</span>
        <span className="absolute bottom-4 right-4 bg-ivory px-2.5 py-1.5 text-[12px] font-semibold uppercase tracking-[0.1em]">After</span>
      </div>
      <label className="mt-4 flex items-center gap-4 text-[14px] text-muted">
        Compare
        <input type="range" min={5} max={95} value={split} onChange={(e) => setSplit(Number(e.target.value))} className="flex-1 accent-navy" aria-label="Move the before and after divider" />
      </label>
    </div>
  );
}
