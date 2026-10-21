"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/auth";
import { bool, dbMessage, fail, int, slugSchema, text, type ActionState } from "@/lib/admin/form";

export async function saveCategory(_prev: ActionState, form: FormData): Promise<ActionState> {
  const { sb } = await requireAdmin();
  const id = text(form, "id");
  if (id && !z.string().uuid().safeParse(id).success) return fail("Unknown category.");

  const fields: Record<string, string> = {};
  const name = text(form, "name");
  if (!name) fields.name = "Enter a name.";
  const slug = slugSchema.safeParse(form.get("slug") ?? "");
  if (!slug.success) fields.slug = slug.error.issues[0].message;
  const imagePath = text(form, "image_path");
  const imageAlt = text(form, "image_alt");
  if (imagePath && !imageAlt) fields.image = "Add alt text for the image.";
  if (Object.keys(fields).length || !slug.success) return fail("Check the highlighted fields.", fields);

  const row = {
    name,
    slug: slug.data,
    description: text(form, "description"),
    image_path: imagePath,
    image_alt: imagePath ? imageAlt : null,
    sort_order: int(form, "sort_order"),
    is_published: bool(form, "is_published"),
  };

  if (id) {
    const { error } = await sb.from("product_categories").update(row).eq("id", id);
    if (error) return fail(dbMessage(error), error.code === "23505" ? { slug: "Already used." } : undefined);
  } else {
    const { data, error } = await sb.from("product_categories").insert(row).select("id").single();
    if (error) return fail(dbMessage(error), error.code === "23505" ? { slug: "Already used." } : undefined);
    revalidatePath("/", "layout");
    redirect(`/admin/categories/${data.id}?created=1`);
  }

  revalidatePath("/", "layout");
  return { status: "ok", message: "Saved." };
}
