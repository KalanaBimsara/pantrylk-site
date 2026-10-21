import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";
import { isStandardUnit } from "@/lib/admin/standard-units";
import { mediaUrl } from "@/lib/supabase/public";
import { priceLabel } from "@/lib/format";
import type { PriceMode } from "@/lib/types";
import { EmptyState, ErrorNote, PageHeader, StatusBadge } from "@/components/admin/Badges";
import { ListError, MoveButtons, PublishButton } from "@/components/admin/RowActions";

export const metadata: Metadata = { title: "Products" };

type Row = {
  id: string;
  slug: string;
  name: string;
  status: string;
  sort_order: number;
  is_featured: boolean;
  price_mode: PriceMode;
  price: number | null;
  product_categories: { name: string } | null;
  product_images: { path: string; alt: string; sort_order: number }[];
};

export default async function ProductsPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error: listError } = await searchParams;
  const { sb } = await requireAdmin();
  const { data, error } = await sb
    .from("products")
    .select("id, slug, name, status, sort_order, is_featured, price_mode, price, product_categories(name), product_images(path, alt, sort_order)")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  const rows = (data ?? []) as unknown as Row[];

  return (
    <>
      <PageHeader eyebrow="Catalogue" title="Products">
        <Link href="/admin/products/new" className="btn btn-navy">
          New product
        </Link>
      </PageHeader>
      <ListError code={listError} />
      {error ? (
        <ErrorNote message={error.message} />
      ) : !rows.length ? (
        <EmptyState>No products yet. Create the first one.</EmptyState>
      ) : (
        <ul className="divide-y divide-line border border-line bg-white">
          {rows.map((p, i) => {
            const cover = p.product_images.slice().sort((a, b) => a.sort_order - b.sort_order)[0];
            const src = mediaUrl(cover?.path);
            const standard = isStandardUnit(p.slug);
            return (
              <li key={p.id} className="flex flex-wrap items-center gap-4 px-4 py-3">
                <MoveButtons list="products" id={p.id} label={p.name} first={i === 0} last={i === rows.length - 1} />
                {src ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={src} alt="" className="h-12 w-16 shrink-0 bg-stone object-cover" />
                ) : (
                  <div className="slot h-12 w-16 shrink-0 p-0 text-[10px]">{standard ? "3D" : "—"}</div>
                )}
                <div className="min-w-0 flex-1">
                  <Link href={`/admin/products/${p.id}`} className="font-semibold hover:underline">
                    {p.name}
                  </Link>
                  <p className="text-[13px] text-muted">
                    {p.product_categories?.name ?? "No category"} · {standard ? "Standard unit (planner price)" : priceLabel(p.price_mode, p.price == null ? null : Number(p.price))}
                    {p.is_featured && " · Featured"}
                  </p>
                </div>
                <StatusBadge status={p.status} />
                <PublishButton list="products" id={p.id} label={p.name} published={p.status === "published"} />
                <Link href={`/admin/products/${p.id}`} className="btn btn-outline min-h-8 px-3 text-[13px]">
                  Edit
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
