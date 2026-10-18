"use client";

import Image from "next/image";
import { useState } from "react";
import type { Img } from "@/lib/types";
import Lightbox from "./Lightbox";

/** Cover + gallery grid; every photo opens the shared lightbox. */
export default function ProjectGallery({ title, images }: { title: string; images: Img[] }) {
  const [open, setOpen] = useState(-1);
  const [cover, ...rest] = images;
  const thumb = "group relative block w-full cursor-zoom-in overflow-hidden bg-stone";
  return (
    <>
      <section aria-label="Project cover photo">
        <button type="button" onClick={() => setOpen(0)} className={`${thumb} h-[clamp(380px,56vw,820px)]`} aria-label={`Open gallery at photo 1 of ${images.length}`}>
          <Image src={cover.src} alt={cover.alt} fill priority sizes="100vw" className="object-cover" />
        </button>
      </section>
      {rest.length > 0 && (
        <section aria-labelledby="gal-h" className="wrap pb-24 pt-20 md:pb-28 md:pt-24">
          <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
            <h2 id="gal-h" className="display h-lg">Gallery</h2>
            <span className="text-[14px] text-muted">{images.length} photos · select to enlarge</span>
          </div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {rest.map((im, i) => (
              <figure key={im.src + i} className={`m-0 flex flex-col gap-2 ${rest.length % 2 === 1 && i === rest.length - 1 ? "md:col-span-2" : ""}`}>
                <button type="button" onClick={() => setOpen(i + 1)} className={`${thumb} ${rest.length % 2 === 1 && i === rest.length - 1 ? "aspect-[4/3] md:aspect-[16/7]" : "aspect-[4/3]"}`} aria-label={`Open photo ${i + 2} of ${images.length}`}>
                  <Image src={im.src} alt={im.alt} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover transition-transform duration-700 group-hover:scale-[1.03]" />
                </button>
                {im.caption && <figcaption className="text-[14px] text-muted">{im.caption}</figcaption>}
              </figure>
            ))}
          </div>
        </section>
      )}
      {open >= 0 && <Lightbox images={images} index={open} onChange={setOpen} onClose={() => setOpen(-1)} label={`${title} gallery`} />}
    </>
  );
}
