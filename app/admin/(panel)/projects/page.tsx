import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";
import { mediaUrl } from "@/lib/supabase/public";
import { EmptyState, ErrorNote, PageHeader, StatusBadge } from "@/components/admin/Badges";
import { ListError, MoveButtons, PublishButton } from "@/components/admin/RowActions";

export const metadata: Metadata = { title: "Our Works" };

type Row = { id: string; slug: string; title: string; status: string; layout: string | null; location: string | null; cover_path: string | null; is_featured: boolean; photos_verified: boolean };

export default async function ProjectsPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error: listError } = await searchParams;
  const { sb } = await requireAdmin();
  const { data, error } = await sb
    .from("projects")
    .select("id, slug, title, status, layout, location, cover_path, is_featured, photos_verified")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  const rows = (data ?? []) as Row[];

  return (
    <>
      <PageHeader eyebrow="Portfolio" title="Our Works">
        <Link href="/admin/projects/new" className="btn btn-navy">
          New project
        </Link>
      </PageHeader>
      <ListError code={listError} />
      {error ? (
        <ErrorNote message={error.message} />
      ) : !rows.length ? (
        <EmptyState>No projects yet. Add your first completed kitchen.</EmptyState>
      ) : (
        <ul className="divide-y divide-line border border-line bg-white">
          {rows.map((p, i) => {
            const src = mediaUrl(p.cover_path);
            return (
              <li key={p.id} className="flex flex-wrap items-center gap-4 px-4 py-3">
                <MoveButtons list="projects" id={p.id} label={p.title} first={i === 0} last={i === rows.length - 1} />
                {src ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={src} alt="" className="h-12 w-16 shrink-0 bg-stone object-cover" />
                ) : (
                  <div className="slot h-12 w-16 shrink-0 p-0 text-[10px]">—</div>
                )}
                <div className="min-w-0 flex-1">
                  <Link href={`/admin/projects/${p.id}`} className="font-semibold hover:underline">
                    {p.title}
                  </Link>
                  <p className="text-[13px] text-muted">
                    {[p.layout, p.location].filter(Boolean).join(" · ") || p.slug}
                    {p.is_featured && " · Featured"}
                    {!p.photos_verified && " · Photos not verified"}
                  </p>
                </div>
                <StatusBadge status={p.status} />
                <PublishButton list="projects" id={p.id} label={p.title} published={p.status === "published"} />
                <Link href={`/admin/projects/${p.id}`} className="btn btn-outline min-h-8 px-3 text-[13px]">
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
