import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import { ErrorNote, PageHeader } from "@/components/admin/Badges";
import { DeleteButton } from "@/components/admin/RowActions";
import CategoryForm from "../CategoryForm";

export const metadata: Metadata = { title: "Edit category" };

export default async function EditCategoryPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string }> }) {
  const [{ id }, { created }] = await Promise.all([params, searchParams]);
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { sb } = await requireAdmin();
  const { data, error } = await sb.from("product_categories").select("*").eq("id", id).maybeSingle();
  if (error) return <ErrorNote message={error.message} />;
  if (!data) notFound();

  return (
    <>
      <PageHeader eyebrow="Categories" title={data.name}>
        <DeleteButton list="categories" id={id} label={data.name} />
      </PageHeader>
      <p className="-mt-4 mb-6 text-[14px] text-muted">Deleting a category keeps its products; they just lose their category.</p>
      <CategoryForm
        key={id}
        category={{
          id,
          name: data.name ?? "",
          slug: data.slug ?? "",
          description: data.description ?? "",
          image_path: data.image_path ?? "",
          image_alt: data.image_alt ?? "",
          sort_order: data.sort_order ?? 0,
          is_published: data.is_published !== false,
        }}
        notice={created ? "Category created." : undefined}
      />
    </>
  );
}
