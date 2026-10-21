import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin/auth";
import { standardUnitDetails } from "@/lib/admin/standard-units";
import { PageHeader } from "@/components/admin/Badges";
import ProductForm from "../ProductForm";

export const metadata: Metadata = { title: "New product" };

export default async function NewProductPage() {
  const { sb } = await requireAdmin();
  const [cats, last] = await Promise.all([
    sb.from("product_categories").select("id, name").order("sort_order"),
    sb.from("products").select("sort_order").order("sort_order", { ascending: false }).limit(1).maybeSingle(),
  ]);

  return (
    <>
      <PageHeader eyebrow="Products" title="New product" />
      <ProductForm
        product={{
          id: null,
          name: "",
          slug: "",
          category_id: null,
          summary: "",
          description: "",
          price_mode: "on_request",
          price: null,
          finishes: [],
          specs: [{ label: "Dimensions", value: "Made to measure" }],
          images: [],
          is_featured: false,
          status: "draft",
          seo_title: "",
          seo_description: "",
          sort_order: Number(last.data?.sort_order ?? -1) + 1,
        }}
        categories={(cats.data ?? []) as { id: string; name: string }[]}
        units={standardUnitDetails()}
      />
    </>
  );
}
