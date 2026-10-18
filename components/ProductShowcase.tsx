"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { Product } from "@/lib/types";
import { priceLabel } from "@/lib/format";
import { whatsappHref, WA_MESSAGES } from "@/lib/whatsapp";
import { ExpandIcon, WhatsAppIcon } from "./Icons";
import Lightbox from "./Lightbox";

type AppInfo = { href: string; external: boolean; available: boolean };

export default function ProductShowcase({ product, whatsappNumber, planner, quote, newTab }: { product: Product; whatsappNumber: string; planner: AppInfo; quote: AppInfo; newTab: boolean }) {
  const [idx, setIdx] = useState(0);
  const [finish, setFinish] = useState(0);
  const [zoom, setZoom] = useState(false);
  const [inquiry, setInquiry] = useState(false);
  const img = product.images[idx];
  const finishName = product.finishes[finish]?.name;
  const message = WA_MESSAGES.product(product.name, finishName);
  const ext = (a: AppInfo) => (a.external && newTab ? { target: "_blank", rel: "noopener noreferrer" } : {});

  return (
    <section className="wrap flex flex-wrap gap-x-18 gap-y-14 pb-24">
      <div className="flex min-w-0 flex-[999_1_560px] flex-col gap-3.5">
        {img ? (
          <button type="button" onClick={() => setZoom(true)} aria-label="Enlarge photo" className="relative aspect-[4/4.4] cursor-zoom-in overflow-hidden bg-stone">
            <Image src={img.src} alt={img.alt} fill priority sizes="(max-width: 1100px) 100vw, 60vw" className="object-cover" />
            <span className="absolute bottom-3.5 right-3.5 inline-flex h-11 w-11 items-center justify-center bg-ivory"><ExpandIcon /></span>
          </button>
        ) : (
          <div className="slot aspect-[4/4.4]">Product photo coming soon</div>
        )}
        {product.images.length > 1 && (
          <div role="group" aria-label="Product photos" className="grid grid-cols-4 gap-3">
            {product.images.map((im, i) => (
              <button key={im.src + i} type="button" onClick={() => setIdx(i)} aria-pressed={i === idx} aria-label={`Show photo ${i + 1}`} className={`relative aspect-square overflow-hidden bg-stone ${i === idx ? "outline-2 outline-navy" : ""}`}>
                <Image src={im.src} alt="" fill sizes="120px" className="object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-[1_1_380px] flex-col gap-6 self-start lg:sticky lg:top-28">
        <div className="flex flex-col gap-3">
          <p className="eyebrow">{product.categoryName}</p>
          <h1 className="display text-[clamp(34px,3.8vw,52px)] leading-[1.02]">{product.name}</h1>
          {product.description && <p className="text-[17px] text-ink-2">{product.description}</p>}
        </div>
        <div className="flex items-baseline justify-between border-y border-line py-4">
          <span className="text-[20px] font-semibold">{priceLabel(product.priceMode, product.price)}</span>
          <span className="text-[14px] text-muted">Made to measure</span>
        </div>
        {product.finishes.length > 0 && (
          <fieldset>
            <legend className="mb-3.5 text-[15px] font-semibold">Finish: <span className="font-normal">{finishName}</span></legend>
            <div className="flex flex-wrap gap-3.5">
              {product.finishes.map((f, i) => (
                <button key={f.name} type="button" aria-pressed={i === finish} aria-label={f.name} onClick={() => setFinish(i)} className={`h-14 w-14 rounded-[2px] border border-[#b9b2a6] ${i === finish ? "outline-2 outline-offset-3 outline-navy" : ""}`} style={{ background: f.hex }} />
              ))}
            </div>
          </fieldset>
        )}
        <div className="flex flex-col gap-2.5">
          <Link href={`/contact?type=product&product=${product.slug}`} className="btn btn-navy min-h-[52px]">Request a Quote for This Product</Link>
          <button type="button" onClick={() => setInquiry(true)} className="btn btn-outline min-h-[52px]"><WhatsAppIcon size={18} /> Ask on WhatsApp</button>
        </div>
        {inquiry && (
          <div role="status" className="flex flex-col gap-3 border border-navy bg-white p-[18px]">
            <p className="text-[15px] font-semibold">Your WhatsApp message is ready</p>
            <p className="bg-ivory px-3.5 py-3 text-[14.5px]">“{message}”</p>
            <div className="flex flex-wrap gap-2.5">
              <a href={whatsappHref(whatsappNumber, message)} target="_blank" rel="noopener noreferrer" className="btn btn-navy flex-1">Open WhatsApp</a>
              <button type="button" className="btn btn-outline" onClick={() => setInquiry(false)}>Cancel</button>
            </div>
            <p className="text-[12.5px] text-muted">Opens WhatsApp with this text. Nothing is sent until you press send there.</p>
          </div>
        )}
        <div className="grid grid-cols-2 gap-2.5">
          <a href={quote.href} {...ext(quote)} className="flex flex-col gap-0.5 border border-line p-3.5 hover:border-navy">
            <span className="text-[14.5px] font-semibold">Quotation Maker{quote.external && " ↗"}</span>
            <span className="text-[13px] text-muted">Get a price estimate</span>
          </a>
          <a href={planner.href} {...ext(planner)} className="flex flex-col gap-0.5 border border-line p-3.5 hover:border-navy">
            <span className="text-[14.5px] font-semibold">Kitchen Planner{!planner.available && <span className="soon">Soon</span>}</span>
            <span className="text-[13px] text-muted">{planner.available ? "Place it in your layout" : "Coming soon"}</span>
          </a>
        </div>
      </div>
      {zoom && product.images.length > 0 && <Lightbox images={product.images} index={idx} onChange={setIdx} onClose={() => setZoom(false)} label={`${product.name} photos`} />}
    </section>
  );
}
