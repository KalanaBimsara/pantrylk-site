import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import Image from "next/image";
import Link from "next/link";
import { getSettings } from "@/lib/content";
import { externalProps, quotationLink } from "@/lib/links";

export const revalidate = 300;

export const metadata: Metadata = pageMeta({
  title: "About Us — Kitchen Cabinet Makers in Bandaragama",
  description: "Pantry LK (Pvt) Ltd designs and manufactures custom kitchen pantries, cabinetry and interior woodwork at our factory in Bandaragama, for homes across Sri Lanka.",
  path: "/about",
});

const approach = [
  { img: "/images/install-progress.jpg", alt: "Base cabinets with open shelving being installed, before doors are fitted", t: "Design approach", d: "We start from the room and the way you cook — walkways, appliances, what needs storing — and plan cabinets around that, not the other way round." },
  { img: "/images/workshop-carcass.jpg", alt: "Open shelving carcass in oak-finish board, assembled and awaiting installation", t: "Manufacturing", d: "Cabinets are made to the measurements taken at your home and checked before they leave for installation." },
  { img: "/images/lit-glass-cabinet.jpg", alt: "Glass display cabinet with integrated lighting and slim frame", t: "Materials & workmanship", d: "Fronts, edges, glass and lighting are chosen together so joints line up and finishes match from unit to unit." },
];

const expect = [
  { t: "One team, start to finish", d: "The people who plan your kitchen work alongside the people who build it." },
  { t: "Clear quotations", d: "You see what's included before you confirm anything." },
  { t: "Real work to look at", d: "The projects on this site are kitchens we completed." },
  { t: "Easy to reach", d: "Call, WhatsApp, email or use the form — whichever suits you." },
];

export default async function AboutPage() {
  const s = await getSettings();
  const quote = quotationLink(s);
  return (
    <>
      <section className="wrap flex flex-col gap-5 pb-20 pt-20 md:pt-24">
        <nav aria-label="Breadcrumb" className="text-[13.5px] text-muted"><Link href="/" className="hover:text-navy">Home</Link> / <span aria-current="page">About Us</span></nav>
        <h1 className="display h-hero max-w-[1100px]">Kitchens made by people who build them.</h1>
        <p className="lead mt-2 max-w-[680px]">
          Pantry LK Pvt Ltd designs and manufactures custom kitchen pantries, cabinetry and related interior woodwork for homes in Sri Lanka — from the first measurement to the final fitting.
        </p>
      </section>

      <section aria-label="Our work" className="grid gap-1 [grid-template-columns:repeat(auto-fit,minmax(min(420px,100%),1fr))]">
        {[
          { src: "/images/workshop-carcass.jpg", alt: "Oak-finish shelving unit assembled and awaiting installation", cap: "In progress" },
          { src: "/images/oak-grey-glass-tall.jpg", alt: "Finished kitchen with oak-finish base units and a lit glass tall unit", cap: "Finished" },
        ].map((x) => (
          <figure key={x.src} className="relative m-0 aspect-[4/3]">
            <Image src={x.src} alt={x.alt} fill sizes="(max-width: 860px) 100vw, 50vw" className="object-cover" />
            <figcaption className="absolute bottom-4 left-4 bg-ivory px-2.5 py-1.5 text-[13px]">{x.cap}</figcaption>
          </figure>
        ))}
      </section>

      <section className="wrap py-24 md:py-30">
        <div className="mb-14 flex max-w-[760px] flex-col gap-4">
          <p className="eyebrow">How we work</p>
          <h2 className="display h-lg">Design and manufacturing under one roof</h2>
        </div>
        <div className="grid gap-12 [grid-template-columns:repeat(auto-fit,minmax(min(300px,100%),1fr))]">
          {approach.map((a) => (
            <div key={a.t} className="flex flex-col gap-4">
              <div className="relative aspect-[4/5] overflow-hidden bg-stone">
                <Image src={a.img} alt={a.alt} fill sizes="(max-width: 1000px) 100vw, 33vw" className="object-cover" />
              </div>
              <h3 className="text-[19px] font-semibold">{a.t}</h3>
              <p className="text-muted">{a.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-navy py-24 text-ivory md:py-28">
        <div className="wrap grid gap-x-24 gap-y-12 [grid-template-columns:repeat(auto-fit,minmax(min(420px,100%),1fr))]">
          <div className="flex flex-col gap-4">
            <p className="eyebrow !text-gold-light">Our mission</p>
            <h2 className="display h-lg">To make well-built, made-to-measure kitchens easier to plan and easier to trust.</h2>
          </div>
          <ul className="flex flex-col">
            {expect.map((x, i) => (
              <li key={x.t} className={`grid grid-cols-[56px_1fr] border-t border-navy-2 py-5 ${i === expect.length - 1 ? "border-b" : ""}`}>
                <span className="display text-[24px] text-gold-light">{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <strong className="font-semibold">{x.t}</strong>
                  <p className="text-[15px] text-on-dark-muted">{x.d}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="wrap flex flex-wrap items-center justify-between gap-8 py-24 md:py-28">
        <h2 className="display h-xl max-w-[720px]">See the kitchens we&apos;ve completed.</h2>
        <div className="flex flex-wrap gap-3">
          <Link href="/our-works" className="btn btn-navy">Explore Our Work</Link>
          <a href={quote.href} {...externalProps(quote, s.openAppsInNewTab)} className="btn btn-outline">Get a Quotation{quote.external && " ↗"}</a>
        </div>
      </section>
    </>
  );
}
