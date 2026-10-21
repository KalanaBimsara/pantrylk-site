import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ProductCard from "@/components/ProductCard";
import ProductShowcase from "@/components/ProductShowcase";
import { getProduct, getProducts, getSettings } from "@/lib/content";
import { plannerLink, quotationLink } from "@/lib/links";
import { siteUnit, unitSizes } from "@/lib/planner/site-products";
import { SITE_URL } from "@/lib/site-url";

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
    title: p.seoTitle ?? p.name,
    description,
    alternates: { canonical: `/products/${p.slug}` },
    openGraph: { title: p.name, description, images: p.images[0] ? [{ url: p.images[0].src, alt: p.images[0].alt }] : undefined },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [product, all, s] = await Promise.all([getProduct(slug), getProducts(), getSettings()]);
  if (!product) notFound();
  const u = siteUnit(product.slug);
  const unit = u ? { plannerId: u.plannerId, showWidth: u.showWidth, sizes: unitSizes(u).map(({ width, label, dims, price }) => ({ width, label, dims, price })) } : undefined;
  const related = all.filter((p) => p.slug !== product.slug).sort((a, b) => Number(b.categorySlug === product.categorySlug) - Number(a.categorySlug === product.categorySlug)).slice(0, 4);

  const productLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description || product.summary,
    image: product.images.map((i) => (i.src.startsWith("http") ? i.src : `${SITE_URL}${i.src}`)),
    brand: { "@type": "Brand", name: "Pantry LK" },
    ...(product.priceMode === "fixed" && product.price != null
      ? { offers: { "@type": "Offer", priceCurrency: "LKR", price: product.price, availability: "https://schema.org/MadeToOrder" } }
      : {}),
  };

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
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productLd).replace(/</g, "\\u003c") }} />
    </>
  );
}
