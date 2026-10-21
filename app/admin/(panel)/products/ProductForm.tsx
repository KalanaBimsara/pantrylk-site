"use client";

import { useState } from "react";
import Link from "next/link";
import { ImageListField, type GalleryImage } from "@/components/admin/ImageFields";
import { FinishesField, RowsField } from "@/components/admin/ListFields";
import { Field, FormMessage, Section, slugify, SubmitButton, useAdminForm } from "@/components/admin/ui";
import { PRICE_MODES, STATUSES } from "@/lib/admin/form";
import type { UnitDetails } from "@/lib/admin/standard-units";
import { saveProduct } from "./actions";

export type ProductInput = {
  id: string | null;
  name: string;
  slug: string;
  category_id: string | null;
  summary: string;
  description: string;
  price_mode: string;
  price: number | null;
  finishes: { name: string; hex: string }[];
  specs: { label: string; value: string }[];
  images: GalleryImage[];
  is_featured: boolean;
  status: string;
  seo_title: string;
  seo_description: string;
  sort_order: number;
};

export default function ProductForm({
  product,
  categories,
  units,
  notice,
}: {
  product: ProductInput;
  categories: { id: string; name: string }[];
  units: Record<string, UnitDetails>;
  notice?: string;
}) {
  const { state, pending, onSubmit, fields } = useAdminForm(saveProduct);
  const [name, setName] = useState(product.name);
  const [slug, setSlug] = useState(product.slug);
  const [slugTouched, setSlugTouched] = useState(!!product.id);
  const [priceMode, setPriceMode] = useState(product.price_mode);
  const unit = units[slug];
  const shown = state.status === "idle" && notice ? ({ status: "ok", message: notice } as const) : state;

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6" noValidate>
      <FormMessage state={shown} />
      {product.id && <input type="hidden" name="id" value={product.id} />}

      <Section title="Basics">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Name" htmlFor="name" error={fields.name}>
            <input
              id="name"
              name="name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!slugTouched) setSlug(slugify(e.target.value));
              }}
              required
              className="field"
              aria-invalid={!!fields.name || undefined}
            />
          </Field>
          <Field
            label="Slug (web address)"
            htmlFor="slug"
            error={fields.slug}
            hint={
              <>
                /products/<strong>{slug || "…"}</strong>
                {product.id && slug !== product.slug && " — changing this breaks old links to the product."}
              </>
            }
          >
            <input
              id="slug"
              name="slug"
              value={slug}
              onChange={(e) => {
                setSlug(e.target.value);
                setSlugTouched(true);
              }}
              required
              className="field font-mono text-[15px]"
              aria-invalid={!!fields.slug || undefined}
            />
          </Field>
          <Field label="Category" htmlFor="category_id" error={fields.category_id}>
            <select id="category_id" name="category_id" defaultValue={product.category_id ?? ""} className="field">
              <option value="">No category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Status" htmlFor="status" error={fields.status} hint="Only published products appear on the website.">
            <select id="status" name="status" defaultValue={product.status} className="field capitalize">
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Summary" htmlFor="summary" hint="One line shown on product cards.">
          <input id="summary" name="summary" defaultValue={product.summary} maxLength={200} className="field" />
        </Field>
        <Field label="Description" htmlFor="description">
          <textarea id="description" name="description" defaultValue={product.description} className="field" />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Sort order" htmlFor="sort_order" hint="Lower numbers show first. You can also use the arrows on the product list.">
            <input id="sort_order" name="sort_order" type="number" step={1} defaultValue={product.sort_order} className="field" />
          </Field>
          <label className="flex items-center gap-3 self-center pt-2 text-[15px] font-semibold sm:pt-6">
            <input type="checkbox" name="is_featured" defaultChecked={product.is_featured} className="h-5 w-5 accent-navy" />
            Featured product
          </label>
        </div>
      </Section>

      {unit ? (
        <Section
          title="Price & specs (set by the planner)"
          description={
            <>
              <strong>{unit.name}</strong> is a standard unit. Its price and specs on the website always come from the Kitchen Planner&apos;s
              pricing rules (<code className="text-[13px]">lib/planner/pricing.ts</code> and <code className="text-[13px]">site-products.ts</code>), so they
              can&apos;t be edited here. Ask your developer to change the rates in code.
            </>
          }
        >
          <dl className="grid gap-x-6 gap-y-2 text-[15px] sm:grid-cols-[180px_1fr]">
            <dt className="font-semibold">Price shown</dt>
            <dd>{unit.price}</dd>
            {unit.specs.map((s) => (
              <div key={s.label} className="contents">
                <dt className="font-semibold">{s.label}</dt>
                <dd>{s.value}</dd>
              </div>
            ))}
          </dl>
        </Section>
      ) : (
        <Section title="Price & specs">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Price display" htmlFor="price_mode" error={fields.price_mode}>
              <select id="price_mode" name="price_mode" value={priceMode} onChange={(e) => setPriceMode(e.target.value)} className="field">
                {PRICE_MODES.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </Field>
            {(priceMode === "fixed" || priceMode === "starting") && (
              <Field label="Price (LKR)" htmlFor="price" error={fields.price}>
                <input
                  id="price"
                  name="price"
                  inputMode="decimal"
                  defaultValue={product.price ?? ""}
                  placeholder="e.g. 45000"
                  className="field"
                  aria-invalid={!!fields.price || undefined}
                />
              </Field>
            )}
          </div>
          <div>
            <RowsField name="specs" label="Specs" hint="e.g. Dimensions → Made to measure" initial={product.specs} />
            {fields.specs && <p className="mt-2 text-[13.5px] text-error">{fields.specs}</p>}
          </div>
        </Section>
      )}

      <Section title="Finishes">
        <FinishesField
          name="finishes"
          label="Finish swatches"
          hint={unit && !product.finishes.length ? `None set, so the website shows the standard unit finishes (${unit.defaultFinishes.map((f) => f.name).join(", ")}).` : "Colour swatches shown on the product page."}
          initial={product.finishes}
        />
        {fields.finishes && <p className="text-[13.5px] text-error">{fields.finishes}</p>}
      </Section>

      <Section title="Photos" description="The first photo is used on product cards and share previews.">
        <ImageListField
          name="images"
          label="Gallery"
          folder="products"
          initial={product.images}
          hint={unit && !product.images.length ? "None set, so the website shows the rendered 3D photos for this unit." : undefined}
        />
        {fields.images && <p className="text-[13.5px] text-error">{fields.images}</p>}
      </Section>

      <Section title="Search engines" description="Optional. Leave blank to use the name and summary.">
        <Field label="SEO title" htmlFor="seo_title">
          <input id="seo_title" name="seo_title" defaultValue={product.seo_title} maxLength={70} className="field" />
        </Field>
        <Field label="SEO description" htmlFor="seo_description">
          <textarea id="seo_description" name="seo_description" defaultValue={product.seo_description} maxLength={170} className="field min-h-24" />
        </Field>
      </Section>

      <div className="sticky bottom-0 -mx-4 flex flex-wrap items-center gap-3 border-t border-line bg-ivory/95 px-4 py-4 backdrop-blur sm:mx-0 sm:px-0">
        <SubmitButton pending={pending}>{product.id ? "Save changes" : "Create product"}</SubmitButton>
        <Link href="/admin/products" className="btn btn-outline">
          Back to products
        </Link>
        {state.status === "error" && <span className="text-[14px] text-error">Not saved — see the message above.</span>}
      </div>
    </form>
  );
}
