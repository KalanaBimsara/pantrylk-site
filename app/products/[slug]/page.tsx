import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ProductCard from "@/components/ProductCard";
import ProductShowcase from "@/components/ProductShowcase";
import { getProduct, getProducts, getSettings } from "@/lib/content";
import { plannerLink, quotationLink } from "@/lib/links";
import { siteUnit, unitSizes } from "@/lib/planner/site-products";
import { absUrl, breadcrumbLd, BUSINESS_ID, ldJson, pageMeta } from "@/lib/seo";

export const revalidate = 300;

export async function generateStaticParams() {
  const products = await getProducts();
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProduct(slug);
  if (!p) return { title: "Product not found" };
  const description = p.seoDescription ?? p.summary ?? p.description;
  return {
    ...pageMeta({ title: p.seoTitle ?? `${p.name} — ${p.categoryName}`, description, path: `/products/${p.slug}`, image: p.images[0] ? { url: p.images[0].src, alt: p.images[0].alt } : null }),
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [product, all, s] = await Promise.all([getProduct(slug), getProducts(), getSettings()]);
  if (!product) notFound();
  const u = siteUnit(product.slug);
  const unit = u ? { plannerId: u.plannerId, showWidth: u.showWidth, sizes: unitSizes(u).map(({ width, label, dims, price }) => ({ width, label, dims, price })) } : undefined;
  const related = all.filter((p) => p.slug !== product.slug).sort((a, b) => Number(b.categorySlug === product.categorySlug) - Number(a.categorySlug === product.categorySlug)).slice(0, 4);

  // Standard units list every size; other products give their fixed or starting price.
  const seller = { "@id": BUSINESS_ID };
  const made = "https://schema.org/MadeToOrder";
  const prices = unit?.sizes.map((s) => s.price) ?? [];
  const offers = prices.length
    ? { "@type": "AggregateOffer", priceCurrency: "LKR", lowPrice: Math.min(...prices), highPrice: Math.max(...prices), offerCount: prices.length, availability: made, seller }
    : product.price != null && product.priceMode === "fixed"
      ? { "@type": "Offer", priceCurrency: "LKR", price: product.price, availability: made, seller, url: absUrl(`/products/${product.slug}`) }
      : product.price != null && product.priceMode === "starting"
        ? { "@type": "AggregateOffer", priceCurrency: "LKR", lowPrice: product.price, availability: made, seller }
        : null;
  const productLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description || product.summary,
    image: product.images.map((i) => absUrl(i.src)),
    sku: product.slug,
    category: product.categoryName,
    url: absUrl(`/products/${product.slug}`),
    brand: { "@type": "Brand", name: "Pantry LK" },
    manufacturer: { "@id": BUSINESS_ID },
    ...(offers ? { offers } : {}),
  };
  const crumbsLd = breadcrumbLd([
    { name: "Home", path: "/" },
    { name: "Products", path: "/products" },
    ...(product.categorySlug ? [{ name: product.categoryName, path: `/products?category=${product.categorySlug}` }] : []),
    { name: product.name, path: `/products/${product.slug}` },
  ]);

  return (
    <>
      <nav aria-label="Breadcrumb" className="wrap pb-7 pt-8 text-[13.5px] text-muted">
        <Link href="/" className="hover:text-navy">Home</Link> / <Link href="/products" className="hover:text-navy">Products</Link> /{" "}
        {product.categorySlug && <><Link href={`/products?category=${product.categorySlug}`} className="hover:text-navy">{product.categoryName}</Link> / </>}
        <span aria-current="page">{product.name}</span>
      </nav>

      <ProductShowcase product={product} whatsappNumber={s.whatsappNumber} planner={plannerLink(s)} quote={quotationLink(s)} newTab={s.openAppsInNewTab} unit={unit} />

      {product.specs.length > 0 && (
        <section className="wrap pb-24">
          <h2 className="display h-lg mb-5">Specifications</h2>
          <table className="w-full max-w-[760px] border-collapse text-[15px]">
            <tbody>
              {product.specs.map((r) => (
                <tr key={r.label}>
                  <th scope="row" className="w-[42%] border-b border-line py-3.5 text-left align-top font-medium text-muted">{r.label}</th>
                  <td className="border-b border-line py-3.5">{r.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {related.length > 0 && (
        <section className="bg-stone py-24">
          <div className="wrap">
            <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
              <h2 className="display h-lg">Related products</h2>
              <Link href="/products" className="tlink">All products →</Link>
            </div>
            <div className="grid gap-6 [grid-template-columns:repeat(auto-fit,minmax(min(250px,100%),1fr))]">
              {related.map((p) => <ProductCard key={p.slug} product={p} />)}
            </div>
          </div>
        </section>
      )}
      <script type="application/ld+json" dangerouslySetInnerHTML={ldJson([productLd, crumbsLd])} />
    </>
  );
}
