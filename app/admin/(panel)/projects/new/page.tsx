import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin/auth";
import { PageHeader } from "@/components/admin/Badges";
import ProjectForm from "../ProjectForm";

export const metadata: Metadata = { title: "New project" };

export default async function NewProjectPage() {
  const { sb } = await requireAdmin();
  const { data: last } = await sb.from("projects").select("sort_order").order("sort_order", { ascending: false }).limit(1).maybeSingle();
  const none = { path: "", alt: "" };
  return (
    <>
      <PageHeader eyebrow="Our Works" title="New project" />
      <ProjectForm
        project={{
          id: null,
          title: "",
          slug: "",
          layout: "",
          style: "",
          project_type: "",
          location: "",
          completed_on: "",
          summary: "",
          requirements: "",
          solution: "",
          materials: [],
          cover: none,
          before: none,
          after: none,
          images: [],
          is_featured: false,
          photos_verified: false,
          status: "draft",
          seo_title: "",
          seo_description: "",
          sort_order: Number(last?.sort_order ?? -1) + 1,
        }}
      />
    </>
  );
}
