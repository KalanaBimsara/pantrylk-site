import { z } from "zod";

/** Result returned by every admin form action (read by useActionState on the client). */
export type ActionState =
  | { status: "idle" }
  | { status: "ok"; message: string }
  | { status: "error"; message: string; fields?: Record<string, string> };

export const IDLE: ActionState = { status: "idle" };

export const STATUSES = ["draft", "published", "unpublished", "archived"] as const;
export type ContentStatus = (typeof STATUSES)[number];

export const INQUIRY_STATUSES = ["New", "Contacted", "In Progress", "Completed", "Archived"] as const;

export const PRICE_MODES = [
  { value: "on_request", label: "Price on request" },
  { value: "starting", label: "Starting from (price)" },
  { value: "fixed", label: "Fixed price" },
  { value: "none", label: "Don't show a price" },
] as const;

/** Images, rows and finishes are edited on the client and posted as JSON in hidden inputs. */
export const imageSchema = z.object({
  path: z.string().trim().min(1, "Every image needs a file."),
  alt: z.string().trim().min(1, "Every image needs alt text (describe what the photo shows)."),
  caption: z.string().trim().max(300).nullable().optional(),
});
export type ImageInput = z.infer<typeof imageSchema>;

export const rowSchema = z.object({ label: z.string().trim(), value: z.string().trim() });
export type RowInput = z.infer<typeof rowSchema>;

export const finishSchema = z.object({
  name: z.string().trim().min(1, "Each finish needs a name."),
  hex: z.string().trim().regex(/^#[0-9a-fA-F]{6}$/, "Finish colours must be a hex code like #624734."),
});
export type FinishInput = z.infer<typeof finishSchema>;

export const slugSchema = z
  .string()
  .trim()
  .min(1, "Enter a slug.")
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and single hyphens only.");

/* ---------------- FormData readers ---------------- */

export function text(form: FormData, name: string): string | null {
  const v = form.get(name);
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

export function int(form: FormData, name: string, fallback = 0): number {
  const n = Number(form.get(name));
  return Number.isFinite(n) ? Math.round(n) : fallback;
}

export function bool(form: FormData, name: string): boolean {
  return form.get(name) === "on" || form.get(name) === "true";
}

/** Parse a JSON hidden input against a schema. Returns the first error message on failure. */
export function jsonField<T>(form: FormData, name: string, schema: z.ZodType<T>): { data: T } | { error: string } {
  let raw: unknown;
  try {
    raw = JSON.parse(String(form.get(name) ?? "[]"));
  } catch {
    return { error: `Couldn't read ${name}.` };
  }
  const parsed = schema.safeParse(raw);
  return parsed.success ? { data: parsed.data } : { error: parsed.error.issues[0]?.message ?? `Check ${name}.` };
}

/** Turn a Postgres / PostgREST error into something the owner can act on. */
export function dbMessage(error: { code?: string; message: string; details?: string | null }): string {
  if (error.code === "23505") return "That slug is already used by another item. Choose a different one.";
  if (error.code === "42501" || /row-level security/i.test(error.message)) return "Your account isn't allowed to make this change (admin only).";
  if (error.code === "23514") {
    if (error.message.includes("projects_publish_requires_verification"))
      return "A project can only be published once its photos are verified and it has a cover image.";
    if (error.message.includes("whatsapp")) return "WhatsApp number must be digits only, 8–15 long (e.g. 94761528123).";
    if (error.message.includes("_url")) return "Kitchen planner and quotation maker links must start with https://";
    return `A value isn't allowed: ${error.message}`;
  }
  if (error.code === "42P01") return "The database tables are missing. Run the migrations in supabase/migrations first.";
  return error.message;
}

export const fail = (message: string, fields?: Record<string, string>): ActionState => ({ status: "error", message, fields });
