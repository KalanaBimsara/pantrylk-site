import Image from "next/image";
import Link from "next/link";
import { getSettings } from "@/lib/content";
import { externalProps, plannerLink, quotationLink } from "@/lib/links";
import { whatsappHref, WA_MESSAGES } from "@/lib/whatsapp";
import { ArrowUpRight, WhatsAppIcon } from "./Icons";
import MobileMenu from "./MobileMenu";
import NavLink from "./NavLink";

export default async function SiteHeader() {
  const s = await getSettings();
  const planner = plannerLink(s);
  const quote = quotationLink(s);
  const wa = whatsappHref(s.whatsappNumber, WA_MESSAGES.general);

  const nav = [
    { label: "Home", href: "/" },
    { label: "Products", href: "/products" },
    { label: "Our Works", href: "/our-works" },
    { label: "Kitchen Planner", href: planner.href, external: planner.external, soon: !planner.available },
    { label: "Quotation Maker", href: quote.href, external: quote.external },
    { label: "About Us", href: "/about" },
    { label: "Contact Us", href: "/contact" },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-ivory">
      <div className="wrap flex h-[76px] items-center gap-6 lg:h-[84px]">
        <Link href="/" aria-label="Pantry LK — home" className="shrink-0">
          <Image src="/brand/logo.png" alt="" width={1152} height={422} priority className="h-10 w-auto lg:h-[54px]" />
        </Link>

        <nav aria-label="Primary" className="hidden flex-1 justify-center gap-6 min-[1180px]:flex">
          {nav.map((n) => (
            <NavLink key={n.label} href={n.href} external={n.external} newTab={s.openAppsInNewTab}>
              {n.label}
              {n.external && <ArrowUpRight size={10} />}
              {n.soon && <span className="soon">Soon</span>}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <a
            href={wa}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Chat with Pantry LK on WhatsApp"
            className="hidden h-12 w-12 items-center justify-center rounded-[2px] border border-line transition-colors hover:border-navy min-[1180px]:inline-flex"
          >
            <WhatsAppIcon />
          </a>
          <a href={quote.href} {...externalProps(quote, s.openAppsInNewTab)} className="btn btn-navy hidden sm:inline-flex">
            Get a Quotation
          </a>
          <MobileMenu
            items={nav.map((n) => ({ label: n.label, href: n.href, external: !!n.external, soon: !!n.soon }))}
            newTab={s.openAppsInNewTab}
            quoteHref={quote.href}
            quoteExternal={quote.external}
            whatsapp={wa}
            phoneIntl={s.phoneIntl}
          />
        </div>
      </div>
    </header>
  );
}
