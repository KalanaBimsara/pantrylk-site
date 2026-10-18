import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSettings } from "@/lib/content";
import { externalProps, quotationLink } from "@/lib/links";
import { whatsappHref, WA_MESSAGES } from "@/lib/whatsapp";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Kitchen Planner — Coming Soon",
  description: "Pantry LK's online Kitchen Planner is coming soon. Until then, plan your kitchen with our team on WhatsApp or get a quotation online.",
  alternates: { canonical: "/kitchen-planner" },
};

export default async function KitchenPlannerPage() {
  const s = await getSettings();
  if (s.kitchenPlannerUrl) redirect(s.kitchenPlannerUrl);
  const quote = quotationLink(s);
  return (
    <section className="wrap py-16 md:py-24">
      <div className="grid border border-line bg-ivory [grid-template-columns:repeat(auto-fit,minmax(min(460px,100%),1fr))]">
        <div className="relative min-h-[360px] md:min-h-[560px]">
          <Image src="/images/vaulted-l-kitchen-2.jpg" alt="" fill priority sizes="(max-width: 940px) 100vw, 50vw" className="object-cover" />
        </div>
        <div className="flex flex-col justify-center gap-6 p-[clamp(28px,5vw,72px)]">
          <p className="eyebrow flex items-center gap-2.5">Kitchen Planner <span className="bg-navy px-2 py-1 text-[11px] tracking-[0.1em] text-ivory">Coming soon</span></p>
          <h1 className="display h-xl">The Kitchen Planner is coming soon.</h1>
          <p className="lead">
            We&apos;re putting the finishing touches on our online planner. Until it launches, our team will plan your kitchen with you — send your room size and a photo on WhatsApp, or get a price estimate with our Quotation Maker.
          </p>
          <div className="flex flex-wrap gap-3">
            <a href={whatsappHref(s.whatsappNumber, WA_MESSAGES.planning)} target="_blank" rel="noopener noreferrer" className="btn btn-gold">Plan With Our Team</a>
            <a href={quote.href} {...externalProps(quote, s.openAppsInNewTab)} className="btn btn-navy">Get a Quotation{quote.external && " ↗"}</a>
          </div>
          <Link href="/our-works" className="tlink self-start">Or browse completed kitchens →</Link>
        </div>
      </div>
    </section>
  );
}
