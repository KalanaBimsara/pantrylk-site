import type { Metadata } from "next";
import Link from "next/link";
import PageIntro from "@/components/PageIntro";
import ProjectsBrowser from "@/components/ProjectsBrowser";
import { getProjects, getSettings } from "@/lib/content";
import { externalProps, quotationLink } from "@/lib/links";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Our Works — Completed Kitchens",
  description: "Completed custom kitchens, pantries and storage walls designed, built and installed by Pantry LK in Sri Lanka.",
  alternates: { canonical: "/our-works" },
};

export default async function OurWorksPage() {
  const [projects, s] = await Promise.all([getProjects(), getSettings()]);
  const quote = quotationLink(s);
  return (
    <>
      <PageIntro
        crumbs={[{ label: "Home", href: "/" }, { label: "Our Works" }]}
        title="Our Works"
        lead="Completed kitchens and storage we've designed, built and installed. Open any project to see the full gallery, materials and how the space was planned."
      />
      <ProjectsBrowser projects={projects} />
      <section className="bg-stone py-24">
        <div className="wrap flex flex-wrap items-center justify-between gap-8">
          <h2 className="display h-xl max-w-[640px]">Seen something close to what you want?</h2>
          <div className="flex flex-wrap gap-3">
            <Link href="/contact" className="btn btn-navy">Discuss a Similar Kitchen</Link>
            <a href={quote.href} {...externalProps(quote, s.openAppsInNewTab)} className="btn btn-outline">Get a Quotation{quote.external && " ↗"}</a>
          </div>
        </div>
      </section>
    </>
  );
}
