import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";
import { getSettings } from "@/lib/content";

export const metadata: Metadata = { title: "Terms and Conditions", alternates: { canonical: "/terms-and-conditions" } };

export default async function TermsPage() {
  const s = await getSettings();
  return (
    <LegalPage title="Terms and Conditions">
      <p className="bg-stone px-4 py-3 text-[15px]">Our full terms and conditions are being finalised.</p>
      <h2>Website content</h2>
      <p>Photos on this website show kitchens and storage made by Pantry LK. Products are made to order, so sizes, finishes and prices are confirmed in your written quotation.</p>
      <h2>Contact</h2>
      <p>Questions about these terms can be sent to <a href={`mailto:${s.email}`}>{s.email}</a>.</p>
    </LegalPage>
  );
}
