"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/auth";
import { bool, dbMessage, fail, imageSchema, int, jsonField, rowSchema, slugSchema, STATUSES, text, type ActionState } from "@/lib/admin/form";

export async function saveProject(_prev: ActionState, form: FormData): Promise<ActionState> {
  const { sb } = await requireAdmin();
  const id = text(form, "id");
  if (id && !z.string().uuid().safeParse(id).success) return fail("Unknown project.");

  const fields: Record<string, string> = {};
  const title = text(form, "title");
  if (!title) fields.title = "Enter a title.";
  const slug = slugSchema.safeParse(form.get("slug") ?? "");
  if (!slug.success) fields.slug = slug.error.issues[0].message;
  const status = String(form.get("status"));
  if (!STATUSES.includes(status as never)) fields.status = "Choose a status.";
  const verified = bool(form, "photos_verified");

  const img = (key: string) => {
    const path = text(form, `${key}_path`);
    const alt = text(form, `${key}_alt`);
    if (path && !alt) fields[key] = "Add alt text for this image.";
    return { path, alt: path ? alt : null };
  };
  const cover = img("cover");
  const before = img("before");
  const after = img("after");
  if (status === "published" && !cover.path) fields.cover = "A published project needs a cover image.";
  if (status === "published" && !verified) fields.photos_verified = "Tick this before publishing.";

  const materials = jsonField(form, "materials", z.array(rowSchema));
  const images = jsonField(form, "images", z.array(imageSchema));
  if ("error" in materials) fields.materials = materials.error;
  else if (materials.data.some((r) => !r.label || !r.value)) fields.materials = "Each material row needs both a label and a value.";
  if ("error" in images) fields.images = images.error;

  if (Object.keys(fields).length || !slug.success || "error" in materials || "error" in images) return fail("Check the highlighted fields.", fields);

  const row: Record<string, unknown> = {
    title,
    slug: slug.data,
    layout: text(form, "layout"),
    style: text(form, "style"),
    project_type: text(form, "project_type"),
    location: text(form, "location"),
    completed_on: text(form, "completed_on"),
    summary: text(form, "summary"),
    requirements: text(form, "requirements"),
    solution: text(form, "solution"),
    materials: materials.data,
    cover_path: cover.path,
    cover_alt: cover.alt,
    before_path: before.path,
    before_alt: before.alt,
    after_path: after.path,
    after_alt: after.alt,
    is_featured: bool(form, "is_featured"),
    photos_verified: verified,
    status,
    seo_title: text(form, "seo_title"),
    seo_description: text(form, "seo_description"),
    sort_order: int(form, "sort_order"),
  };

  if (status === "published") {
    const existing = id ? await sb.from("projects").select("published_at").eq("id", id).maybeSingle() : null;
    if (!existing?.data?.published_at) row.published_at = new Date().toISOString();
  }

  let projectId = id;
  if (id) {
    const { error } = await sb.from("projects").update(row).eq("id", id);
    if (error) return fail(dbMessage(error), error.code === "23505" ? { slug: "Already used." } : undefined);
  } else {
    const { data, error } = await sb.from("projects").insert(row).select("id").single();
    if (error) return fail(dbMessage(error), error.code === "23505" ? { slug: "Already used." } : undefined);
    projectId = data.id as string;
  }

  const del = await sb.from("project_images").delete().eq("project_id", projectId);
  if (del.error) return fail(`Project saved, but gallery images weren't: ${dbMessage(del.error)}`);
  if (images.data.length) {
    const { error } = await sb
      .from("project_images")
      .insert(images.data.map((im, i) => ({ project_id: projectId, path: im.path, alt: im.alt, caption: im.caption ?? null, sort_order: i })));
    if (error) return fail(`Project saved, but gallery images weren't: ${dbMessage(error)}`);
  }

  revalidatePath("/", "layout");
  if (!id) redirect(`/admin/projects/${projectId}?created=1`);
  return { status: "ok", message: status === "published" ? "Saved. Changes are live on the website." : "Saved." };
}
