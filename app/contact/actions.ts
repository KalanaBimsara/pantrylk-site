"use server";

import { headers } from "next/headers";
import { getPublicSupabase } from "@/lib/supabase/public";
import { fieldErrors, inquirySchema, type InquiryState } from "@/lib/inquiry-schema";

// Best-effort, per-instance rate limit. For multi-instance hosting, back this
// with a shared store (e.g. a Supabase table or Upstash) — see README.
const hits = new Map<string, number[]>();
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;

function limited(key: string) {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(key, recent);
  return recent.length > MAX_PER_WINDOW;
}

function makeRef() {
  const d = new Date();
  const ymd = `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  const rand = Array.from(crypto.getRandomValues(new Uint8Array(3)), (b) => b.toString(36).padStart(2, "0")).join("").slice(0, 4).toUpperCase();
  return `INQ-${ymd}-${rand}`;
}

export async function submitInquiry(_prev: InquiryState, form: FormData): Promise<InquiryState> {
  // Honeypot + minimum fill time: bots fill hidden fields and submit instantly.
  const honeypot = String(form.get("website") ?? "");
  const startedAt = Number(form.get("started_at") ?? 0);
  if (honeypot || (startedAt && Date.now() - startedAt < 2500)) return { status: "limited" };

  const h = await headers();
  const ip = (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || h.get("x-real-ip") || "unknown";
  if (limited(ip)) return { status: "limited" };

  const parsed = inquirySchema.safeParse({
    full_name: form.get("full_name") ?? "",
    phone: form.get("phone") ?? "",
    email: form.get("email") ?? "",
    inquiry_type: form.get("inquiry_type") ?? "",
    message: form.get("message") ?? "",
  });
  if (!parsed.success) return { status: "invalid", errors: fieldErrors(parsed) };

  const sb = getPublicSupabase();
  if (!sb) {
    console.error("[inquiry] Supabase is not configured — inquiry not saved.");
    return { status: "failed" };
  }

  const ref = makeRef();
  const source = String(form.get("source_page") ?? "").slice(0, 300) || null;
  const { error } = await sb.from("inquiries").insert({
    ref,
    full_name: parsed.data.full_name,
    phone: parsed.data.phone,
    email: parsed.data.email || null,
    inquiry_type: parsed.data.inquiry_type,
    message: parsed.data.message,
    source_page: source,
    status: "New",
  });
  if (error) {
    console.error("[inquiry] insert failed:", error.message);
    return { status: "failed" };
  }
  return { status: "success", ref, firstName: parsed.data.full_name.split(/\s+/)[0], phone: parsed.data.phone };
}
