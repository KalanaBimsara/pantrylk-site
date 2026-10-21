"use client";

import { Field, FormMessage, Section, SubmitButton, useAdminForm } from "@/components/admin/ui";
import { saveSettings } from "./actions";

export type SettingsInput = Record<
  | "company_name"
  | "tagline"
  | "phone_display"
  | "phone_intl"
  | "whatsapp_number"
  | "email"
  | "address"
  | "business_hours"
  | "map_url"
  | "facebook_url"
  | "instagram_url"
  | "tiktok_url"
  | "kitchen_planner_url"
  | "quotation_maker_url",
  string
> & { open_apps_in_new_tab: boolean };

type Key = Exclude<keyof SettingsInput, "open_apps_in_new_tab">;

export default function SettingsForm({ settings }: { settings: SettingsInput }) {
  const { state, pending, onSubmit, fields } = useAdminForm(saveSettings);

  const input = (key: Key, label: string, opts: { hint?: string; type?: string; placeholder?: string } = {}) => (
    <Field label={label} htmlFor={key} hint={opts.hint} error={fields[key]}>
      <input
        id={key}
        name={key}
        type={opts.type ?? "text"}
        defaultValue={settings[key]}
        placeholder={opts.placeholder}
        className="field"
        aria-invalid={!!fields[key] || undefined}
      />
    </Field>
  );

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6" noValidate>
      <FormMessage state={state} />
      <Section title="Company">
        <div className="grid gap-5 sm:grid-cols-2">
          {input("company_name", "Company name")}
          {input("tagline", "Tagline")}
        </div>
      </Section>

      <Section title="Contact" description="Shown in the header, footer, contact page and search results.">
        <div className="grid gap-5 sm:grid-cols-2">
          {input("phone_display", "Phone (as shown)", { placeholder: "076 152 8123" })}
          {input("phone_intl", "Phone (international, for tap-to-call)", { placeholder: "+94761528123" })}
          {input("whatsapp_number", "WhatsApp number", { hint: "Digits only with country code.", placeholder: "94761528123" })}
          {input("email", "Email", { type: "email" })}
        </div>
        <Field label="Address" htmlFor="address" error={fields.address}>
          <textarea id="address" name="address" defaultValue={settings.address} className="field min-h-24" />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          {input("map_url", "Google Maps link", { type: "url", placeholder: "https://maps.app.goo.gl/…" })}
          <Field label="Business hours" htmlFor="business_hours" hint="e.g. Mon–Sat 8.30 am – 5.30 pm">
            <input id="business_hours" name="business_hours" defaultValue={settings.business_hours} className="field" />
          </Field>
        </div>
      </Section>

      <Section title="Social links" description="Leave blank to hide the icon.">
        <div className="grid gap-5 sm:grid-cols-3">
          {input("facebook_url", "Facebook", { type: "url" })}
          {input("instagram_url", "Instagram", { type: "url" })}
          {input("tiktok_url", "TikTok", { type: "url" })}
        </div>
      </Section>

      <Section title="Planner & quotation apps">
        <div className="grid gap-5 sm:grid-cols-2">
          {input("kitchen_planner_url", "External kitchen planner link", {
            type: "url",
            hint: "Leave blank to use the built-in 3D planner at /kitchen-planner.",
          })}
          {input("quotation_maker_url", "Quotation maker link", { type: "url", placeholder: "https://…" })}
        </div>
        <label className="flex items-center gap-3 text-[15px] font-semibold">
          <input type="checkbox" name="open_apps_in_new_tab" defaultChecked={settings.open_apps_in_new_tab} className="h-5 w-5 accent-navy" />
          Open these apps in a new tab
        </label>
      </Section>

      <div className="sticky bottom-0 -mx-4 flex items-center gap-3 border-t border-line bg-ivory/95 px-4 py-4 backdrop-blur sm:mx-0 sm:px-0">
        <SubmitButton pending={pending}>Save settings</SubmitButton>
        {state.status === "error" && <span className="text-[14px] text-error">Not saved — see the message above.</span>}
      </div>
    </form>
  );
}
