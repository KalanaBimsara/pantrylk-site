"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { Project } from "@/lib/types";
import { SearchIcon } from "./Icons";

export default function ProjectsBrowser({ projects }: { projects: Project[] }) {
  const layouts = useMemo(() => ["All", ...Array.from(new Set(projects.map((p) => p.layout).filter(Boolean)))], [projects]);
  const [filter, setFilter] = useState("All");
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const shown = projects.filter(
    (p) => (filter === "All" || p.layout === filter) && (!q || `${p.title} ${p.style} ${p.layout} ${p.summary ?? ""}`.toLowerCase().includes(q)),
  );

  return (
    <>
      <section aria-label="Filter projects" className="sticky top-[76px] z-20 border-b border-line bg-ivory lg:top-[84px]">
        <div className="wrap flex flex-wrap items-center justify-between gap-4 py-4">
          <div role="group" aria-label="Kitchen layout" className="flex flex-wrap gap-2">
            {layouts.map((l) => (
              <button
                key={l}
                type="button"
                aria-pressed={filter === l}
                onClick={() => setFilter(l)}
                className="min-h-11 rounded-[2px] border border-[#b9b2a6] px-[18px] text-[14.5px] font-medium transition-colors hover:border-navy aria-pressed:border-navy aria-pressed:bg-navy aria-pressed:text-ivory"
              >
                {l}
              </button>
            ))}
          </div>
          <div className="relative w-full sm:w-[320px]">
            <label htmlFor="ow-search" className="sr-only">Search projects</label>
            <SearchIcon className="pointer-events-none absolute left-3.5 top-[15px] text-muted" />
            <input
              id="ow-search"
              type="search"
              placeholder="Search by style or finish"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-12 w-full rounded-[2px] border border-[#b9b2a6] bg-white pl-11 pr-3.5 text-[15.5px]"
            />
          </div>
        </div>
      </section>

      <section className="wrap pb-24 pt-7">
        <p role="status" aria-live="polite" className="mb-7 text-[14px] text-muted">
          {shown.length === 1 ? "Showing 1 project" : `Showing ${shown.length} projects`}
        </p>
        {shown.length > 0 ? (
          <div className="columns-1 gap-7 sm:columns-2 lg:columns-3">
            {shown.map((p, i) => {
              const tall = i % 3 === 1;
              return (
                <Link key={p.slug} href={`/our-works/${p.slug}`} className="group mb-11 flex break-inside-avoid flex-col gap-3">
                  <div className="card-img" style={{ aspectRatio: tall ? "3 / 4" : "4 / 3" }}>
                    <Image src={p.cover.src} alt={p.cover.alt} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" className="object-cover" />
                  </div>
                  <p className="flex gap-2.5 text-[13px] tracking-[0.04em] text-muted">
                    <span>{p.layout}</span>
                    {p.style && <><span aria-hidden="true">·</span><span>{p.style}</span></>}
                  </p>
                  <h3 className="display text-[24px] leading-tight underline-offset-4 group-hover:underline">{p.title}</h3>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 border border-line px-6 py-18 text-center">
            <h2 className="display text-[28px]">{projects.length ? "No projects match that yet" : "New projects are being photographed"}</h2>
            <p className="max-w-[440px] text-muted">
              {projects.length
                ? "Try a different layout or search term — or tell us what you have in mind and we'll show you similar work."
                : "We're adding completed kitchens here. In the meantime, ask us to share photos of work similar to yours."}
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {projects.length > 0 && (
                <button type="button" className="btn btn-outline" onClick={() => { setFilter("All"); setQuery(""); }}>
                  Clear filters
                </button>
              )}
              <Link href="/contact" className="btn btn-navy">Contact Our Team</Link>
            </div>
          </div>
        )}
      </section>
    </>
  );
}
