import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";
import { getSettings } from "@/lib/content";

export const metadata: Metadata = { title: "Privacy Policy", alternates: { canonical: "/privacy-policy" } };

export default async function PrivacyPage() {
  const s = await getSettings();
  return (
    <LegalPage title="Privacy Policy">
      <p className="bg-stone px-4 py-3 text-[15px]">Our full privacy policy is being finalised. This page summarises what the website currently does.</p>
      <h2>Information you send us</h2>
      <p>When you use the contact form we receive your name, phone number, optional email address, the type of inquiry and your message. We use these only to reply to your inquiry and discuss your project.</p>
      <h2>WhatsApp, phone and email</h2>
      <p>If you contact us through WhatsApp, phone or email, those conversations are handled through those services under their own terms.</p>
      <h2>Questions</h2>
      <p>For any question about your information, email <a href={`mailto:${s.email}`}>{s.email}</a> or call <a href={`tel:${s.phoneIntl}`}>{s.phoneDisplay}</a>.</p>
    </LegalPage>
  );
}
