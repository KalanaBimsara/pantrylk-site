import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";
import { mediaUrl } from "@/lib/supabase/public";
import { EmptyState, ErrorNote, PageHeader, StatusBadge } from "@/components/admin/Badges";
import { ListError, MoveButtons, PublishButton } from "@/components/admin/RowActions";

export const metadata: Metadata = { title: "Categories" };

type Row = { id: string; slug: string; name: string; description: string | null; image_path: string | null; is_published: boolean; products: { count: number }[] };

export default async function CategoriesPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error: listError } = await searchParams;
  const { sb } = await requireAdmin();
  const { data, error } = await sb
    .from("product_categories")
    .select("id, slug, name, description, image_path, is_published, products(count)")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  const rows = (data ?? []) as unknown as Row[];

  return (
    <>
      <PageHeader eyebrow="Catalogue" title="Product categories">
        <Link href="/admin/categories/new" className="btn btn-navy">
          New category
        </Link>
      </PageHeader>
      <ListError code={listError} />
      {error ? (
        <ErrorNote message={error.message} />
      ) : !rows.length ? (
        <EmptyState>No categories yet.</EmptyState>
      ) : (
        <ul className="divide-y divide-line border border-line bg-white">
          {rows.map((c, i) => {
            const src = mediaUrl(c.image_path);
            const count = c.products?.[0]?.count ?? 0;
            return (
              <li key={c.id} className="flex flex-wrap items-center gap-4 px-4 py-3">
                <MoveButtons list="categories" id={c.id} label={c.name} first={i === 0} last={i === rows.length - 1} />
                {src ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={src} alt="" className="h-12 w-16 shrink-0 bg-stone object-cover" />
                ) : (
                  <div className="slot h-12 w-16 shrink-0 p-0 text-[10px]">—</div>
                )}
                <div className="min-w-0 flex-1">
                  <Link href={`/admin/categories/${c.id}`} className="font-semibold hover:underline">
                    {c.name}
                  </Link>
                  <p className="text-[13px] text-muted">
                    {c.slug} · {count} product{count === 1 ? "" : "s"}
                  </p>
                </div>
                <StatusBadge status={c.is_published ? "published" : "unpublished"} />
                <PublishButton list="categories" id={c.id} label={c.name} published={c.is_published} />
                <Link href={`/admin/categories/${c.id}`} className="btn btn-outline min-h-8 px-3 text-[13px]">
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
