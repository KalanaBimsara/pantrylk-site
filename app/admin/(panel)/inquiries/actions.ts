"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/auth";
import { dbMessage, fail, INQUIRY_STATUSES, text, type ActionState } from "@/lib/admin/form";

const uuid = z.string().uuid();

export async function setInquiryStatus(_prev: ActionState, form: FormData): Promise<ActionState> {
  const { sb } = await requireAdmin();
  const id = String(form.get("id") ?? "");
  const status = String(form.get("status") ?? "");
  if (!uuid.safeParse(id).success) return fail("Unknown inquiry.");
  if (!INQUIRY_STATUSES.includes(status as never)) return fail("Choose a status.");

  const { error } = await sb.from("inquiries").update({ status }).eq("id", id);
  if (error) return fail(dbMessage(error));
  revalidatePath("/admin", "layout");
  return { status: "ok", message: `Marked as ${status}.` };
}

export async function addInquiryNote(_prev: ActionState, form: FormData): Promise<ActionState> {
  const { sb, user } = await requireAdmin();
  const id = String(form.get("inquiry_id") ?? "");
  const body = text(form, "body");
  if (!uuid.safeParse(id).success) return fail("Unknown inquiry.");
  if (!body) return fail("Write a note first.", { body: "Write a note first." });
  if (body.length > 4000) return fail("Notes can be up to 4,000 characters.", { body: "Too long." });

  const { error } = await sb.from("inquiry_notes").insert({ inquiry_id: id, author_id: user.id, body });
  if (error) return fail(dbMessage(error));
  revalidatePath(`/admin/inquiries/${id}`);
  return { status: "ok", message: "Note added." };
}
