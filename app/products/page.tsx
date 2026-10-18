import type { Metadata } from "next";
import { Suspense } from "react";
import PageIntro from "@/components/PageIntro";
import ProductsBrowser from "@/components/ProductsBrowser";
import { getCategories, getProducts, getSettings } from "@/lib/content";
import { plannerLink } from "@/lib/links";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Products — Pantry Units, Kitchen Cabinets & Storage",
  description: "Custom pantry units, base and wall cabinets, tall pantry cabinets and kitchen islands, made to measure in Sri Lanka by Pantry LK.",
  alternates: { canonical: "/products" },
};

export default async function ProductsPage() {
  const [products, categories, s] = await Promise.all([getProducts(), getCategories(), getSettings()]);
  const planner = plannerLink(s);
  return (
    <>
      <PageIntro
        crumbs={[{ label: "Home", href: "/" }, { label: "Products" }]}
        title="Products"
        lead="Cabinets, pantry units and fittings we make to order. Sizes and finishes are tailored to your kitchen, so most items are priced after a quick consultation."
      />
      <Suspense fallback={<div className="wrap pb-24 text-muted">Loading products…</div>}>
        <ProductsBrowser products={products} categories={categories} plannerHref={planner.href} plannerAvailable={planner.available} />
      </Suspense>
    </>
  );
}
