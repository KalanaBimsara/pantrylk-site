"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";

/** Row actions shared by the Products, Categories and Our Works lists: reorder, publish, delete. */
const LISTS = {
  products: { table: "products", page: "/admin/products", flag: "status" },
  projects: { table: "projects", page: "/admin/projects", flag: "status" },
  categories: { table: "product_categories", page: "/admin/categories", flag: "is_published" },
} as const;
type ListKey = keyof typeof LISTS;

function target(form: FormData) {
  const key = String(form.get("list")) as ListKey;
  const id = String(form.get("id") ?? "");
  if (!(key in LISTS) || !/^[0-9a-f-]{36}$/i.test(id)) throw new Error("Bad request");
  return { ...LISTS[key], id };
}

function back(page: string, error?: string): never {
  redirect(error ? `${page}?error=${error}` : page);
}

/** Swap an item with its neighbour, renumbering the list 0..n so equal sort orders can't stick. */
export async function moveItem(form: FormData) {
  const { sb } = await requireAdmin();
  const { table, page, id } = target(form);
  const dir = form.get("dir") === "up" ? -1 : 1;

  const { data, error } = await sb.from(table).select("id, sort_order").order("sort_order", { ascending: true }).order("created_at", { ascending: true });
  if (error || !data) back(page, "failed");
  const ids = (data as { id: string }[]).map((r) => r.id);
  const i = ids.indexOf(id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= ids.length) back(page);
  [ids[i], ids[j]] = [ids[j], ids[i]];

  const current = new Map((data as { id: string; sort_order: number }[]).map((r) => [r.id, r.sort_order]));
  const changes = ids.map((rid, n) => ({ rid, n })).filter(({ rid, n }) => current.get(rid) !== n);
  for (const { rid, n } of changes) {
    const { error: e } = await sb.from(table).update({ sort_order: n }).eq("id", rid);
    if (e) back(page, "failed");
  }
  revalidatePath("/", "layout");
  back(page);
}

/** Publish / unpublish from the list. Projects that aren't verified are refused by the database. */
export async function setPublished(form: FormData) {
  const { sb } = await requireAdmin();
  const { table, page, flag, id } = target(form);
  const publish = form.get("publish") === "true";

  let patch: Record<string, unknown>;
  if (flag === "is_published") patch = { is_published: publish };
  else {
    patch = { status: publish ? "published" : "unpublished" };
    if (publish) {
      const { data } = await sb.from(table).select("published_at").eq("id", id).maybeSingle();
      if (!data?.published_at) patch.published_at = new Date().toISOString();
    }
  }

  const { error } = await sb.from(table).update(patch).eq("id", id);
  if (error) back(page, error.code === "23514" ? "verify" : "failed");
  revalidatePath("/", "layout");
  back(page);
}

export async function deleteItem(form: FormData) {
  const { sb } = await requireAdmin();
  const { table, page, id } = target(form);
  const { error } = await sb.from(table).delete().eq("id", id);
  if (error) back(page, "failed");
  revalidatePath("/", "layout");
  back(page);
}
