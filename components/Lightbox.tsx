"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import type { Img } from "@/lib/types";
import { ChevronLeft, ChevronRight, CloseIcon } from "./Icons";

export default function Lightbox({ images, index, onChange, onClose, label }: { images: Img[]; index: number; onChange: (i: number) => void; onClose: () => void; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const returnFocus = useRef<Element | null>(null);
  const n = images.length;
  const img = images[index];

  useEffect(() => {
    returnFocus.current = document.activeElement;
    ref.current?.focus();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
      (returnFocus.current as HTMLElement | null)?.focus?.();
    };
  }, []);

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") onClose();
    if (e.key === "ArrowLeft") onChange((index - 1 + n) % n);
    if (e.key === "ArrowRight") onChange((index + 1) % n);
    if (e.key === "Tab") {
      const f = ref.current?.querySelectorAll<HTMLElement>("button");
      if (!f || !f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  }

  const btn = "inline-flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-[2px] border border-white/35 text-white hover:bg-white/10";
  return (
    <div ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-label={label} onKeyDown={onKeyDown} className="fade-in fixed inset-0 z-[100] flex flex-col bg-[rgba(12,22,36,0.96)] text-white outline-none">
      <div className="flex items-center justify-between px-[clamp(16px,4vw,40px)] py-4">
        <span className="text-[14px] tabular-nums" aria-live="polite">{index + 1} / {n}</span>
        <button type="button" className={btn} onClick={onClose} aria-label="Close gallery"><CloseIcon /></button>
      </div>
      <div className="flex min-h-0 flex-1 items-center gap-2 px-2 sm:gap-4 sm:px-8">
        {n > 1 && <button type="button" className={btn} onClick={() => onChange((index - 1 + n) % n)} aria-label="Previous photo"><ChevronLeft /></button>}
        <div className="relative h-full min-w-0 flex-1">
          <Image key={img.src} src={img.src} alt={img.alt} fill sizes="100vw" className="object-contain" />
        </div>
        {n > 1 && <button type="button" className={btn} onClick={() => onChange((index + 1) % n)} aria-label="Next photo"><ChevronRight /></button>}
      </div>
      <p className="px-4 pb-7 pt-4 text-center text-[15px] text-[#d9d4ca]">{img.caption || img.alt}</p>
    </div>
  );
}
