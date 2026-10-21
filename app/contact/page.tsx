import type { Metadata } from "next";
import ContactForm from "@/components/ContactForm";
import PageIntro from "@/components/PageIntro";
import { ClockIcon, MailIcon, PhoneIcon, PinIcon, WhatsAppIcon } from "@/components/Icons";
import { getSettings } from "@/lib/content";
import { externalProps, plannerLink, quotationLink } from "@/lib/links";
import { whatsappHref, WA_MESSAGES } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Call, WhatsApp or email Pantry LK about a new kitchen, pantry or cabinetry project in Sri Lanka.",
  alternates: { canonical: "/contact" },
};

export default async function ContactPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const s = await getSettings();
  const planner = plannerLink(s);
  const quote = quotationLink(s);
  const wa = whatsappHref(s.whatsappNumber, WA_MESSAGES.general);
  const type = sp.type === "product" ? "Product inquiry" : sp.type === "project" ? "New kitchen project" : undefined;
  const product = typeof sp.product === "string" && /^[a-z0-9-]{1,80}$/.test(sp.product) ? sp.product : undefined;

  const row = "grid grid-cols-[44px_1fr] items-start gap-x-3.5 gap-y-1 border-t border-line py-[18px]";
  const ic = "flex h-11 w-11 items-center justify-center border border-line";

  return (
    <>
      <PageIntro
        crumbs={[{ label: "Home", href: "/" }, { label: "Contact Us" }]}
        title="Let's talk about your kitchen"
        lead="Send a message, call or WhatsApp us. Tell us a little about your space and we'll get back to you to discuss next steps."
      />
      <section className="wrap flex flex-wrap items-start gap-x-22 gap-y-14 pb-28">
        <div className="min-w-0 flex-[999_1_560px] border border-line bg-white p-[clamp(20px,4vw,48px)]">
          <ContactForm whatsappHref={wa} defaultType={type} sourcePage={product ? `/products/${product}` : "/contact"} />
        </div>
        <aside aria-label="Other ways to reach us" className="flex min-w-0 flex-[1_1_340px] flex-col">
          <h2 className="display mb-3 text-[26px]">Other ways to reach us</h2>
          <div className={row}>
            <span className={ic}><PhoneIcon /></span>
            <div><strong className="block font-semibold">Telephone</strong><a href={`tel:${s.phoneIntl}`} className="font-semibold underline-offset-4 hover:underline">{s.phoneDisplay}</a></div>
          </div>
          <div className={row}>
            <span className={ic}><WhatsAppIcon size={18} /></span>
            <div>
              <strong className="block font-semibold">WhatsApp</strong>
              <a href={wa} target="_blank" rel="noopener noreferrer" className="font-semibold underline-offset-4 hover:underline">{s.phoneDisplay}</a>
              <p className="text-[13.5px] text-muted">Opens WhatsApp with a short greeting filled in.</p>
            </div>
          </div>
          <div className={row}>
            <span className={ic}><MailIcon /></span>
            <div><strong className="block font-semibold">Email</strong><a href={`mailto:${s.email}`} className="break-all font-semibold underline-offset-4 hover:underline">{s.email}</a></div>
          </div>
          {s.address && (
            <div className={row}>
              <span className={ic}><PinIcon /></span>
              <div>
                <strong className="block font-semibold">Address</strong>
                <span>{s.address}</span>
                {s.mapUrl && <a href={s.mapUrl} target="_blank" rel="noopener noreferrer" className="mt-1 block text-[14px] font-semibold underline">Get directions ↗</a>}
              </div>
            </div>
          )}
          {s.businessHours && (
            <div className={row}>
              <span className={ic}><ClockIcon /></span>
              <div><strong className="block font-semibold">Business hours</strong><span>{s.businessHours}</span></div>
            </div>
          )}
          <div className="mt-8 flex flex-col gap-2.5 border-t border-line pt-8">
            <a href={quote.href} {...externalProps(quote, s.openAppsInNewTab)} className="btn btn-gold">Get a Quotation{quote.external && " ↗"}</a>
            {planner.available ? (
              <a href={planner.href} {...externalProps(planner, s.openAppsInNewTab)} className="btn btn-outline">Open Kitchen Planner{planner.external && " ↗"}</a>
            ) : (
              <p className="text-center text-[13.5px] text-muted">Kitchen Planner — coming soon</p>
            )}
          </div>
        </aside>
      </section>
    </>
  );
}
