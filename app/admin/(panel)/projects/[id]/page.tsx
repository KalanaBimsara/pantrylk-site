import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import { ErrorNote, PageHeader, StatusBadge } from "@/components/admin/Badges";
import { DeleteButton } from "@/components/admin/RowActions";
import { ArrowUpRight } from "@/components/Icons";
import ProjectForm, { type ProjectInput } from "../ProjectForm";

export const metadata: Metadata = { title: "Edit project" };

type Row = Record<string, unknown>;
const s = (v: unknown) => (typeof v === "string" ? v : "");

export default async function EditProjectPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string }> }) {
  const [{ id }, { created }] = await Promise.all([params, searchParams]);
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { sb } = await requireAdmin();
  const { data, error } = await sb.from("projects").select("*, project_images(path, alt, caption, sort_order)").eq("id", id).maybeSingle();
  if (error) return <ErrorNote message={error.message} />;
  if (!data) notFound();
  const r = data as Row;

  const project: ProjectInput = {
    id,
    title: s(r.title),
    slug: s(r.slug),
    layout: s(r.layout),
    style: s(r.style),
    project_type: s(r.project_type),
    location: s(r.location),
    completed_on: s(r.completed_on),
    summary: s(r.summary),
    requirements: s(r.requirements),
    solution: s(r.solution),
    materials: Array.isArray(r.materials) ? r.materials : [],
    cover: { path: s(r.cover_path), alt: s(r.cover_alt) },
    before: { path: s(r.before_path), alt: s(r.before_alt) },
    after: { path: s(r.after_path), alt: s(r.after_alt) },
    images: (Array.isArray(r.project_images) ? (r.project_images as Row[]) : [])
      .sort((a, b) => Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0))
      .map((im) => ({ path: s(im.path), alt: s(im.alt), caption: (im.caption as string | null) ?? null })),
    is_featured: r.is_featured === true,
    photos_verified: r.photos_verified === true,
    status: s(r.status) || "draft",
    seo_title: s(r.seo_title),
    seo_description: s(r.seo_description),
    sort_order: Number(r.sort_order ?? 0),
  };

  return (
    <>
      <PageHeader eyebrow="Our Works" title={project.title || "Untitled project"}>
        <StatusBadge status={project.status} />
        {project.status === "published" && (
          <Link href={`/our-works/${project.slug}`} target="_blank" className="tlink text-[14px]">
            View on site <ArrowUpRight size={10} />
          </Link>
        )}
        <DeleteButton list="projects" id={id} label={project.title} />
      </PageHeader>
      <ProjectForm key={id} project={project} notice={created ? "Project created." : undefined} />
    </>
  );
}
