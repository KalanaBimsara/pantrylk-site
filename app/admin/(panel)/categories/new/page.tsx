import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin/auth";
import { PageHeader } from "@/components/admin/Badges";
import CategoryForm from "../CategoryForm";

export const metadata: Metadata = { title: "New category" };

export default async function NewCategoryPage() {
  const { sb } = await requireAdmin();
  const { data: last } = await sb.from("product_categories").select("sort_order").order("sort_order", { ascending: false }).limit(1).maybeSingle();
  return (
    <>
      <PageHeader eyebrow="Categories" title="New category" />
      <CategoryForm
        category={{ id: null, name: "", slug: "", description: "", image_path: "", image_alt: "", sort_order: Number(last?.sort_order ?? -1) + 1, is_published: true }}
      />
    </>
  );
}
