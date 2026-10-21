"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/auth";
import { bool, dbMessage, fail, text, type ActionState } from "@/lib/admin/form";

const isUrl = (v: string, httpsOnly = false) => {
  try {
    const u = new URL(v);
    return httpsOnly ? u.protocol === "https:" : u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
};

export async function saveSettings(_prev: ActionState, form: FormData): Promise<ActionState> {
  const { sb } = await requireAdmin();
  const fields: Record<string, string> = {};

  const companyName = text(form, "company_name");
  if (!companyName) fields.company_name = "Enter the company name.";

  const whatsapp = text(form, "whatsapp_number")?.replace(/[\s+()-]/g, "") ?? null;
  if (whatsapp && !/^[0-9]{8,15}$/.test(whatsapp)) fields.whatsapp_number = "Digits only with the country code, e.g. 94761528123.";

  const phoneIntl = text(form, "phone_intl")?.replace(/[\s()-]/g, "") ?? null;
  if (phoneIntl && !/^\+[0-9]{8,15}$/.test(phoneIntl)) fields.phone_intl = "Use the international format, e.g. +94761528123.";

  const email = text(form, "email");
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fields.email = "Enter a valid email address.";

  const urls: Record<string, boolean> = {
    map_url: false,
    facebook_url: false,
    instagram_url: false,
    tiktok_url: false,
    kitchen_planner_url: true,
    quotation_maker_url: true,
  };
  const urlValues: Record<string, string | null> = {};
  for (const [key, httpsOnly] of Object.entries(urls)) {
    const v = text(form, key);
    urlValues[key] = v;
    if (v && !isUrl(v, httpsOnly)) fields[key] = httpsOnly ? "Must be a full link starting with https://" : "Must be a full link, e.g. https://…";
  }

  if (Object.keys(fields).length) return fail("Check the highlighted fields.", fields);

  const { error } = await sb.from("site_settings").upsert({
    id: 1,
    company_name: companyName,
    tagline: text(form, "tagline"),
    phone_display: text(form, "phone_display"),
    phone_intl: phoneIntl,
    whatsapp_number: whatsapp,
    email,
    address: text(form, "address"),
    business_hours: text(form, "business_hours"),
    ...urlValues,
    open_apps_in_new_tab: bool(form, "open_apps_in_new_tab"),
  });
  if (error) return fail(dbMessage(error));

  revalidatePath("/", "layout");
  return { status: "ok", message: "Settings saved. The website updates within a few seconds." };
}
