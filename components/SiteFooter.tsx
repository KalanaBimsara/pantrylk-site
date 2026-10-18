import Image from "next/image";
import Link from "next/link";
import { getCategories, getSettings } from "@/lib/content";
import { externalProps, plannerLink, quotationLink } from "@/lib/links";
import { whatsappHref, WA_MESSAGES } from "@/lib/whatsapp";
import { FacebookIcon, InstagramIcon, TikTokIcon } from "./Icons";

export default async function SiteFooter() {
  const [s, cats] = await Promise.all([getSettings(), getCategories()]);
  const planner = plannerLink(s);
  const quote = quotationLink(s);
  const socials = [
    { href: s.facebookUrl, label: "Facebook", Icon: FacebookIcon },
    { href: s.instagramUrl, label: "Instagram", Icon: InstagramIcon },
    { href: s.tiktokUrl, label: "TikTok", Icon: TikTokIcon },
  ].filter((x) => x.href);
  const linkCls = "text-on-dark hover:text-white hover:underline underline-offset-4";

  return (
    <footer className="border-t border-navy-2 bg-navy text-on-dark">
      <div className="wrap grid gap-x-10 gap-y-12 pb-9 pt-20 [grid-template-columns:repeat(auto-fit,minmax(min(190px,100%),1fr))]">
        <div className="flex flex-col gap-5">
          <Image src="/brand/logo-light.png" alt="Pantry LK Pvt Ltd" width={1152} height={422} className="h-[58px] w-auto self-start" />
          <p className="max-w-[280px] text-[15px] text-on-dark-muted">{s.tagline}</p>
        </div>
        <nav aria-label="Footer — explore" className="flex flex-col gap-3 text-[15px]">
          <p className="eyebrow mb-1 !text-gold-light">Explore</p>
          <Link className={linkCls} href="/">Home</Link>
          <Link className={linkCls} href="/our-works">Our Works</Link>
          <Link className={linkCls} href="/products">Products</Link>
          <Link className={linkCls} href="/about">About Us</Link>
          <Link className={linkCls} href="/contact">Contact Us</Link>
        </nav>
        <nav aria-label="Footer — products" className="flex flex-col gap-3 text-[15px]">
          <p className="eyebrow mb-1 !text-gold-light">Products</p>
          {cats.slice(0, 6).map((c) => (
            <Link key={c.slug} className={linkCls} href={`/products?category=${c.slug}`}>{c.name}</Link>
          ))}
        </nav>
        <nav aria-label="Footer — plan and price" className="flex flex-col gap-3 text-[15px]">
          <p className="eyebrow mb-1 !text-gold-light">Plan &amp; price</p>
          <a className={linkCls} href={quote.href} {...externalProps(quote, s.openAppsInNewTab)}>Quotation Maker{quote.external && " ↗"}</a>
          <a className={linkCls} href={planner.href} {...externalProps(planner, s.openAppsInNewTab)}>
            Kitchen Planner{!planner.available && <span className="soon">Soon</span>}
          </a>
        </nav>
        <div className="flex flex-col gap-3 text-[15px]">
          <p className="eyebrow mb-1 !text-gold-light">Contact</p>
          <a className={linkCls} href={`tel:${s.phoneIntl}`}>{s.phoneDisplay}</a>
          <a className={linkCls} href={whatsappHref(s.whatsappNumber, WA_MESSAGES.general)} target="_blank" rel="noopener noreferrer">WhatsApp · {s.phoneDisplay}</a>
          <a className={`${linkCls} break-all`} href={`mailto:${s.email}`}>{s.email}</a>
          {s.address && <span className="text-on-dark-muted">{s.address}</span>}
          {s.businessHours && <span className="text-on-dark-muted">{s.businessHours}</span>}
          {socials.length > 0 && (
            <div className="mt-1.5 flex gap-2.5">
              {socials.map(({ href, label, Icon }) => (
                <a key={label} href={href!} target="_blank" rel="noopener noreferrer" aria-label={`Pantry LK on ${label}`} className="inline-flex h-11 w-11 items-center justify-center border border-navy-2 hover:border-gold-light">
                  <Icon />
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="wrap flex flex-wrap justify-between gap-4 border-t border-navy-2 py-6 text-[13.5px] text-on-dark-muted">
        <span>© {new Date().getFullYear()} {s.companyName}. All rights reserved.</span>
        <div className="flex gap-6">
          <Link className="hover:text-white" href="/privacy-policy">Privacy Policy</Link>
          <Link className="hover:text-white" href="/terms-and-conditions">Terms and Conditions</Link>
        </div>
      </div>
    </footer>
  );
}
