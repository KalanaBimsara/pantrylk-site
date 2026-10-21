"use client";

import { useState } from "react";
import Link from "next/link";
import { ImageField } from "@/components/admin/ImageFields";
import { Field, FormMessage, Section, slugify, SubmitButton, useAdminForm } from "@/components/admin/ui";
import { saveCategory } from "./actions";

export type CategoryInput = {
  id: string | null;
  name: string;
  slug: string;
  description: string;
  image_path: string;
  image_alt: string;
  sort_order: number;
  is_published: boolean;
};

export default function CategoryForm({ category, notice }: { category: CategoryInput; notice?: string }) {
  const { state, pending, onSubmit, fields } = useAdminForm(saveCategory);
  const [slug, setSlug] = useState(category.slug);
  const [slugTouched, setSlugTouched] = useState(!!category.id);
  const shown = state.status === "idle" && notice ? ({ status: "ok", message: notice } as const) : state;

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6" noValidate>
      <FormMessage state={shown} />
      {category.id && <input type="hidden" name="id" value={category.id} />}
      <Section title="Category">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Name" htmlFor="name" error={fields.name}>
            <input
              id="name"
              name="name"
              defaultValue={category.name}
              onChange={(e) => !slugTouched && setSlug(slugify(e.target.value))}
              className="field"
              aria-invalid={!!fields.name || undefined}
            />
          </Field>
          <Field label="Slug" htmlFor="slug" error={fields.slug} hint="Used in product filters. Lowercase letters, numbers and hyphens.">
            <input
              id="slug"
              name="slug"
              value={slug}
              onChange={(e) => {
                setSlug(e.target.value);
                setSlugTouched(true);
              }}
              className="field font-mono text-[15px]"
              aria-invalid={!!fields.slug || undefined}
            />
          </Field>
        </div>
        <Field label="Description" htmlFor="description">
          <input id="description" name="description" defaultValue={category.description} maxLength={200} className="field" />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Sort order" htmlFor="sort_order" hint="Lower numbers show first.">
            <input id="sort_order" name="sort_order" type="number" step={1} defaultValue={category.sort_order} className="field" />
          </Field>
          <label className="flex items-center gap-3 self-center pt-2 text-[15px] font-semibold sm:pt-6">
            <input type="checkbox" name="is_published" defaultChecked={category.is_published} className="h-5 w-5 accent-navy" />
            Show on the website
          </label>
        </div>
        <ImageField name="image" label="Image" folder="categories" initial={{ path: category.image_path, alt: category.image_alt }} />
        {fields.image && <p className="text-[13.5px] text-error">{fields.image}</p>}
      </Section>
      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton pending={pending}>{category.id ? "Save changes" : "Create category"}</SubmitButton>
        <Link href="/admin/categories" className="btn btn-outline">
          Back to categories
        </Link>
      </div>
    </form>
  );
}
