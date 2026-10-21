"use client";

import { useState } from "react";
import Link from "next/link";
import { ImageField, ImageListField, type GalleryImage } from "@/components/admin/ImageFields";
import { RowsField } from "@/components/admin/ListFields";
import { Field, FormMessage, Section, slugify, SubmitButton, useAdminForm } from "@/components/admin/ui";
import { STATUSES } from "@/lib/admin/form";
import { saveProject } from "./actions";

type Img = { path: string; alt: string };

export type ProjectInput = {
  id: string | null;
  title: string;
  slug: string;
  layout: string;
  style: string;
  project_type: string;
  location: string;
  completed_on: string;
  summary: string;
  requirements: string;
  solution: string;
  materials: { label: string; value: string }[];
  cover: Img;
  before: Img;
  after: Img;
  images: GalleryImage[];
  is_featured: boolean;
  photos_verified: boolean;
  status: string;
  seo_title: string;
  seo_description: string;
  sort_order: number;
};

const TEXT_FIELDS: { key: keyof ProjectInput; label: string; hint?: string }[] = [
  { key: "layout", label: "Layout", hint: "e.g. Island, L-shaped, Galley" },
  { key: "style", label: "Style", hint: "e.g. Contemporary, Classic" },
  { key: "project_type", label: "Project type", hint: "e.g. New build, Renovation" },
  { key: "location", label: "Location", hint: "District only — never a street address." },
  { key: "completed_on", label: "Completed", hint: "e.g. March 2026. Only if you're sure." },
];

export default function ProjectForm({ project, notice }: { project: ProjectInput; notice?: string }) {
  const { state, pending, onSubmit, fields } = useAdminForm(saveProject);
  const [slug, setSlug] = useState(project.slug);
  const [slugTouched, setSlugTouched] = useState(!!project.id);
  const shown = state.status === "idle" && notice ? ({ status: "ok", message: notice } as const) : state;
  const err = (k: string) => fields[k] && <p className="text-[13.5px] text-error">{fields[k]}</p>;

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6" noValidate>
      <FormMessage state={shown} />
      {project.id && <input type="hidden" name="id" value={project.id} />}

      <Section title="Basics">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Title" htmlFor="title" error={fields.title}>
            <input
              id="title"
              name="title"
              defaultValue={project.title}
              onChange={(e) => !slugTouched && setSlug(slugify(e.target.value))}
              className="field"
              aria-invalid={!!fields.title || undefined}
            />
          </Field>
          <Field label="Slug (web address)" htmlFor="slug" error={fields.slug} hint={<>/our-works/<strong>{slug || "…"}</strong></>}>
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
          {TEXT_FIELDS.map((f) => (
            <Field key={f.key} label={f.label} htmlFor={f.key} hint={f.hint}>
              <input id={f.key} name={f.key} defaultValue={String(project[f.key] ?? "")} className="field" />
            </Field>
          ))}
          <Field label="Sort order" htmlFor="sort_order" hint="Lower numbers show first.">
            <input id="sort_order" name="sort_order" type="number" step={1} defaultValue={project.sort_order} className="field" />
          </Field>
        </div>
        <Field label="Summary" htmlFor="summary" hint="One or two sentences for project cards.">
          <textarea id="summary" name="summary" defaultValue={project.summary} className="field min-h-24" />
        </Field>
        <Field label="What the homeowner needed" htmlFor="requirements">
          <textarea id="requirements" name="requirements" defaultValue={project.requirements} className="field" />
        </Field>
        <Field label="What we built" htmlFor="solution">
          <textarea id="solution" name="solution" defaultValue={project.solution} className="field" />
        </Field>
        <div>
          <RowsField name="materials" label="Materials & finishes" hint="e.g. Wall units → Grey high-gloss fronts" initial={project.materials} />
          {err("materials")}
        </div>
      </Section>

      <Section title="Publishing">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Status" htmlFor="status" error={fields.status} hint="Only published projects appear on the website.">
            <select id="status" name="status" defaultValue={project.status} className="field capitalize">
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Field>
          <div className="flex flex-col gap-3 pt-1 sm:pt-7">
            <label className="flex items-center gap-3 text-[15px] font-semibold">
              <input type="checkbox" name="is_featured" defaultChecked={project.is_featured} className="h-5 w-5 accent-navy" />
              Featured on the home page
            </label>
          </div>
        </div>
        <div className={`border p-4 ${fields.photos_verified ? "border-error" : "border-gold/60 bg-gold/5"}`}>
          <label className="flex items-start gap-3 text-[15px]">
            <input type="checkbox" name="photos_verified" defaultChecked={project.photos_verified} className="mt-1 h-5 w-5 shrink-0 accent-navy" />
            <span>
              <strong>Photos verified.</strong> These are photos of a genuine Pantry LK installation, and the homeowner agreed to them being shown.
              Required before publishing.
            </span>
          </label>
          {err("photos_verified")}
        </div>
      </Section>

      <Section title="Photos">
        <ImageField name="cover" label="Cover photo (required to publish)" folder="projects" initial={project.cover} />
        {err("cover")}
        <ImageListField name="images" label="Gallery" folder="projects" initial={project.images} />
        {err("images")}
      </Section>

      <Section title="Before & after" description="Optional. Shown as a slider when both are set.">
        <ImageField name="before" label="Before" folder="projects" initial={project.before} />
        {err("before")}
        <ImageField name="after" label="After" folder="projects" initial={project.after} />
        {err("after")}
      </Section>

      <Section title="Search engines" description="Optional. Leave blank to use the title and summary.">
        <Field label="SEO title" htmlFor="seo_title">
          <input id="seo_title" name="seo_title" defaultValue={project.seo_title} maxLength={70} className="field" />
        </Field>
        <Field label="SEO description" htmlFor="seo_description">
          <textarea id="seo_description" name="seo_description" defaultValue={project.seo_description} maxLength={170} className="field min-h-24" />
        </Field>
      </Section>

      <div className="sticky bottom-0 -mx-4 flex flex-wrap items-center gap-3 border-t border-line bg-ivory/95 px-4 py-4 backdrop-blur sm:mx-0 sm:px-0">
        <SubmitButton pending={pending}>{project.id ? "Save changes" : "Create project"}</SubmitButton>
        <Link href="/admin/projects" className="btn btn-outline">
          Back to Our Works
        </Link>
        {state.status === "error" && <span className="text-[14px] text-error">Not saved — see the message above.</span>}
      </div>
    </form>
  );
}
