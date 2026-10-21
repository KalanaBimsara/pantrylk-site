import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import LegalPage from "@/components/LegalPage";
import { getSettings } from "@/lib/content";

export const metadata: Metadata = pageMeta({ title: "Privacy Policy", description: "How the Pantry LK website handles the information you share with us.", path: "/privacy-policy" });

export default async function PrivacyPage() {
  const s = await getSettings();
  return (
    <LegalPage title="Privacy Policy">
      <p className="bg-stone px-4 py-3 text-[15px]">Our full privacy policy is being finalised. This page summarises what the website currently does.</p>
      <h2>Information you send us</h2>
      <p>When you use the contact form we receive your name, phone number, optional email address, the type of inquiry and your message. We use these only to reply to your inquiry and discuss your project.</p>
      <h2>WhatsApp, phone and email</h2>
      <p>If you contact us through WhatsApp, phone or email, those conversations are handled through those services under their own terms.</p>
      <h2>Kitchen Planner</h2>
      <p>Designs you make in the Kitchen Planner are saved in your own browser so you can come back to them. Nothing is sent to us unless you choose to share a link or send your design on WhatsApp.</p>
      <h2>Maps</h2>
      <p>The map on our contact page is provided by Google Maps and only loads when you press “Show map”. Google may then set its own cookies under its privacy policy.</p>
      <h2>Questions</h2>
      <p>For any question about your information, email <a href={`mailto:${s.email}`}>{s.email}</a> or call <a href={`tel:${s.phoneIntl}`}>{s.phoneDisplay}</a>.</p>
    </LegalPage>
  );
}
