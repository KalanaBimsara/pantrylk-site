"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { Category, Product } from "@/lib/types";
import ProductCard from "./ProductCard";
import { SearchIcon } from "./Icons";

const PAGE = 9;

export default function ProductsBrowser({ products, categories, plannerHref, plannerAvailable }: { products: Product[]; categories: Category[]; plannerHref: string; plannerAvailable: boolean }) {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const active = params.get("category") ?? "all";
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("featured");
  const [limit, setLimit] = useState(PAGE);

  const setCategory = (slug: string) => {
    setLimit(PAGE);
    router.replace(slug === "all" ? pathname : `${pathname}?category=${slug}`, { scroll: false });
  };

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = products.filter(
      (p) => (active === "all" || p.categorySlug === active) && (!q || `${p.name} ${p.summary} ${p.categoryName}`.toLowerCase().includes(q)),
    );
    if (sort === "az") list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    if (sort === "featured") list = [...list].sort((a, b) => Number(b.featured) - Number(a.featured));
    return list;
  }, [products, active, query, sort]);

  const cats = [{ slug: "all", name: "All products" }, ...categories];

  return (
    <section className="wrap flex flex-wrap gap-12 pb-24">
      <aside aria-label="Product categories" className="flex flex-[1_1_240px] flex-col gap-8 md:max-w-[280px]">
        <div>
          <p className="eyebrow mb-2.5">Category</p>
          <div className="flex flex-col">
            {cats.map((c) => {
              const count = c.slug === "all" ? products.length : products.filter((p) => p.categorySlug === c.slug).length;
              const on = active === c.slug;
              return (
                <button
                  key={c.slug}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setCategory(c.slug)}
                  className={`flex min-h-11 w-full items-center justify-between border-l-2 px-3 text-left text-[15px] hover:bg-[#efeae1] ${on ? "border-navy bg-[#efeae1] font-semibold" : "border-transparent font-medium"}`}
                >
                  <span>{c.name}</span>
                  <span className="text-[13px] tabular-nums text-muted">{count}</span>
                </button>
              );
            })}
          </div>
        </div>
        <div className="flex flex-col gap-3 border-t border-line pt-6">
          <p className="font-semibold">Not sure what you need?</p>
          <p className="text-[14.5px] text-muted">
            {plannerAvailable ? "Plan the whole kitchen first, then we'll suggest the right units." : "Our online Kitchen Planner is coming soon. Until then, we can plan the whole kitchen with you."}
          </p>
          {plannerAvailable ? (
            <a href={plannerHref} target="_blank" rel="noopener noreferrer" className="btn btn-gold">Open Kitchen Planner ↗</a>
          ) : (
            <Link href="/contact" className="btn btn-gold">Plan With Our Team</Link>
          )}
        </div>
      </aside>

      <div className="min-w-0 flex-[999_1_560px]">
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <div className="relative flex-[1_1_260px]">
            <label htmlFor="pr-search" className="sr-only">Search products</label>
            <SearchIcon className="pointer-events-none absolute left-3.5 top-[15px] text-muted" />
            <input id="pr-search" type="search" placeholder="Search products" value={query} onChange={(e) => { setQuery(e.target.value); setLimit(PAGE); }} className="h-12 w-full rounded-[2px] border border-[#b9b2a6] bg-white pl-11 pr-3.5 text-[15.5px]" />
          </div>
          <label className="flex items-center gap-2.5 text-[14px] text-muted">
            Sort
            <select value={sort} onChange={(e) => setSort(e.target.value)} className="h-12 rounded-[2px] border border-[#b9b2a6] bg-white px-3 text-[15px] font-medium text-navy">
              <option value="featured">Featured first</option>
              <option value="az">Name A–Z</option>
            </select>
          </label>
        </div>
        <p role="status" aria-live="polite" className="mb-5 text-[14px] text-muted">{shown.length} {shown.length === 1 ? "product" : "products"}</p>

        {shown.length > 0 ? (
          <>
            <div className="grid gap-6 [grid-template-columns:repeat(auto-fill,minmax(min(250px,100%),1fr))]">
              {shown.slice(0, limit).map((p) => <ProductCard key={p.slug} product={p} />)}
            </div>
            {shown.length > limit && (
              <div className="mt-12 flex justify-center">
                <button type="button" className="btn btn-outline" onClick={() => setLimit((l) => l + PAGE)}>Load More Products</button>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center gap-3.5 border border-line px-6 py-16 text-center">
            <h2 className="display text-[26px]">{products.length ? "No products match your search" : "Products are being added"}</h2>
            <p className="max-w-[420px] text-muted">Everything we make is custom, so if you don&apos;t see it listed, ask — we may still be able to build it.</p>
            <div className="flex flex-wrap justify-center gap-3">
              {products.length > 0 && <button type="button" className="btn btn-outline" onClick={() => { setQuery(""); setCategory("all"); }}>Clear search</button>}
              <Link href="/contact" className="btn btn-navy">Ask About a Custom Piece</Link>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
