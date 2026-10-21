"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/auth";
import { isStandardUnit } from "@/lib/admin/standard-units";
import {
  bool,
  dbMessage,
  fail,
  finishSchema,
  imageSchema,
  int,
  jsonField,
  PRICE_MODES,
  rowSchema,
  slugSchema,
  STATUSES,
  text,
  type ActionState,
} from "@/lib/admin/form";

const uuid = z.string().uuid();

export async function saveProduct(_prev: ActionState, form: FormData): Promise<ActionState> {
  const { sb } = await requireAdmin();
  const id = text(form, "id");
  if (id && !uuid.safeParse(id).success) return fail("Unknown product.");

  const fields: Record<string, string> = {};
  const name = text(form, "name");
  if (!name) fields.name = "Enter a name.";
  const slug = slugSchema.safeParse(form.get("slug") ?? "");
  if (!slug.success) fields.slug = slug.error.issues[0].message;
  const status = String(form.get("status"));
  if (!STATUSES.includes(status as never)) fields.status = "Choose a status.";
  const categoryId = text(form, "category_id");
  if (categoryId && !uuid.safeParse(categoryId).success) fields.category_id = "Choose a category.";

  const standard = slug.success && isStandardUnit(slug.data);
  const priceMode = String(form.get("price_mode") ?? "on_request");
  const priceRaw = text(form, "price");
  const price = priceRaw == null ? null : Number(priceRaw.replace(/[,\s]/g, ""));
  if (!standard) {
    if (!PRICE_MODES.some((m) => m.value === priceMode)) fields.price_mode = "Choose how the price is shown.";
    if (price != null && (!Number.isFinite(price) || price < 0)) fields.price = "Enter a price in LKR, e.g. 45000.";
    else if ((priceMode === "fixed" || priceMode === "starting") && price == null) fields.price = "Enter the price for this price mode.";
  }

  const specs = jsonField(form, "specs", z.array(rowSchema));
  const finishes = jsonField(form, "finishes", z.array(finishSchema));
  const images = jsonField(form, "images", z.array(imageSchema));
  if ("error" in specs) fields.specs = specs.error;
  else if (specs.data.some((r) => !r.label || !r.value)) fields.specs = "Each spec needs both a label and a value.";
  if ("error" in finishes) fields.finishes = finishes.error;
  if ("error" in images) fields.images = images.error;

  if (Object.keys(fields).length || !slug.success || "error" in specs || "error" in finishes || "error" in images)
    return fail("Check the highlighted fields.", fields);

  const row: Record<string, unknown> = {
    name,
    slug: slug.data,
    category_id: categoryId,
    summary: text(form, "summary"),
    description: text(form, "description"),
    finishes: finishes.data,
    is_featured: bool(form, "is_featured"),
    status,
    seo_title: text(form, "seo_title"),
    seo_description: text(form, "seo_description"),
    sort_order: int(form, "sort_order"),
  };
  // Standard units get price and specs from the planner rules; don't overwrite what's stored.
  if (!standard) Object.assign(row, { price_mode: priceMode, price, specs: specs.data });
  else if (!id) Object.assign(row, { price_mode: "starting", price: null, specs: [] });

  if (status === "published") {
    const existing = id ? await sb.from("products").select("published_at").eq("id", id).maybeSingle() : null;
    if (!existing?.data?.published_at) row.published_at = new Date().toISOString();
  }

  let productId = id;
  if (id) {
    const { error } = await sb.from("products").update(row).eq("id", id);
    if (error) return fail(dbMessage(error), error.code === "23505" ? { slug: "Already used." } : undefined);
  } else {
    const { data, error } = await sb.from("products").insert(row).select("id").single();
    if (error) return fail(dbMessage(error), error.code === "23505" ? { slug: "Already used." } : undefined);
    productId = data.id as string;
  }

  // Replace the gallery so order, alt text and captions match the editor exactly.
  const del = await sb.from("product_images").delete().eq("product_id", productId);
  if (del.error) return fail(`Product saved, but images weren't: ${dbMessage(del.error)}`);
  if (images.data.length) {
    const { error } = await sb
      .from("product_images")
      .insert(images.data.map((im, i) => ({ product_id: productId, path: im.path, alt: im.alt, caption: im.caption ?? null, sort_order: i })));
    if (error) return fail(`Product saved, but images weren't: ${dbMessage(error)}`);
  }

  revalidatePath("/", "layout");
  if (!id) redirect(`/admin/products/${productId}?created=1`);
  return { status: "ok", message: status === "published" ? "Saved. Changes are live on the website." : "Saved." };
}
