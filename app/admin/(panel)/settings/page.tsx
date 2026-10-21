import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin/auth";
import { ErrorNote, PageHeader } from "@/components/admin/Badges";
import { seedSettings } from "@/content/seed";
import SettingsForm, { type SettingsInput } from "./SettingsForm";

export const metadata: Metadata = { title: "Site settings" };

export default async function SettingsPage() {
  const { sb } = await requireAdmin();
  const { data, error } = await sb.from("site_settings").select("*").eq("id", 1).maybeSingle();
  if (error) return <ErrorNote message={error.message} />;
  // With no row yet, start from the defaults the website is currently showing.
  const d = (data ?? {
    company_name: seedSettings.companyName,
    tagline: seedSettings.tagline,
    phone_display: seedSettings.phoneDisplay,
    phone_intl: seedSettings.phoneIntl,
    whatsapp_number: seedSettings.whatsappNumber,
    email: seedSettings.email,
    address: seedSettings.address,
    map_url: seedSettings.mapUrl,
    quotation_maker_url: seedSettings.quotationMakerUrl,
  }) as Record<string, unknown>;
  const s = (k: string) => (typeof d[k] === "string" ? (d[k] as string) : "");

  const settings: SettingsInput = {
    company_name: s("company_name") || "Pantry LK Pvt Ltd",
    tagline: s("tagline"),
    phone_display: s("phone_display"),
    phone_intl: s("phone_intl"),
    whatsapp_number: s("whatsapp_number"),
    email: s("email"),
    address: s("address"),
    business_hours: s("business_hours"),
    map_url: s("map_url"),
    facebook_url: s("facebook_url"),
    instagram_url: s("instagram_url"),
    tiktok_url: s("tiktok_url"),
    kitchen_planner_url: s("kitchen_planner_url"),
    quotation_maker_url: s("quotation_maker_url"),
    open_apps_in_new_tab: d.open_apps_in_new_tab !== false,
  };

  return (
    <>
      <PageHeader eyebrow="Website" title="Site settings" />
      {!data && (
        <p className="mb-6 border border-gold/60 bg-gold/5 px-4 py-3 text-[14.5px]">
          No settings are saved in the database yet, so the website uses its built-in defaults (filled in below). Saving this form stores them.
        </p>
      )}
      <p className="-mt-4 mb-6 text-[14px] text-muted">Phone, WhatsApp, email, address and map link fall back to the built-in defaults if left blank.</p>
      <SettingsForm settings={settings} />
    </>
  );
}
