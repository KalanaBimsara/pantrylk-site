import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import { standardUnitDetails } from "@/lib/admin/standard-units";
import { ErrorNote, PageHeader, StatusBadge } from "@/components/admin/Badges";
import { DeleteButton } from "@/components/admin/RowActions";
import { ArrowUpRight } from "@/components/Icons";
import ProductForm, { type ProductInput } from "../ProductForm";

export const metadata: Metadata = { title: "Edit product" };

type Row = Record<string, unknown>;
const s = (v: unknown) => (typeof v === "string" ? v : "");
const arr = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);

export default async function EditProductPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string }> }) {
  const [{ id }, { created }] = await Promise.all([params, searchParams]);
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { sb } = await requireAdmin();

  const [{ data, error }, cats] = await Promise.all([
    sb.from("products").select("*, product_images(path, alt, caption, sort_order)").eq("id", id).maybeSingle(),
    sb.from("product_categories").select("id, name").order("sort_order"),
  ]);
  if (error) return <ErrorNote message={error.message} />;
  if (!data) notFound();
  const r = data as Row;

  const product: ProductInput = {
    id,
    name: s(r.name),
    slug: s(r.slug),
    category_id: (r.category_id as string | null) ?? null,
    summary: s(r.summary),
    description: s(r.description),
    price_mode: s(r.price_mode) || "on_request",
    price: r.price == null ? null : Number(r.price),
    finishes: arr(r.finishes),
    specs: arr(r.specs),
    images: arr<Row>(r.product_images)
      .sort((a, b) => Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0))
      .map((im) => ({ path: s(im.path), alt: s(im.alt), caption: (im.caption as string | null) ?? null })),
    is_featured: r.is_featured === true,
    status: s(r.status) || "draft",
    seo_title: s(r.seo_title),
    seo_description: s(r.seo_description),
    sort_order: Number(r.sort_order ?? 0),
  };

  return (
    <>
      <PageHeader eyebrow="Products" title={product.name || "Untitled product"}>
        <StatusBadge status={product.status} />
        {product.status === "published" && (
          <Link href={`/products/${product.slug}`} target="_blank" className="tlink text-[14px]">
            View on site <ArrowUpRight size={10} />
          </Link>
        )}
        <DeleteButton list="products" id={id} label={product.name} />
      </PageHeader>
      <ProductForm
        key={id}
        product={product}
        categories={(cats.data ?? []) as { id: string; name: string }[]}
        units={standardUnitDetails()}
        notice={created ? "Product created." : undefined}
      />
    </>
  );
}
