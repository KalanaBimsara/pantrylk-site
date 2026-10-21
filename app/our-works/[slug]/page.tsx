import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import BeforeAfter from "@/components/BeforeAfter";
import ProjectCard from "@/components/ProjectCard";
import ProjectGallery from "@/components/ProjectGallery";
import { getProject, getProjects, getSettings } from "@/lib/content";
import { absUrl, breadcrumbLd, BUSINESS_ID, ldJson, pageMeta } from "@/lib/seo";
import { whatsappHref, WA_MESSAGES } from "@/lib/whatsapp";

export const revalidate = 300;

export async function generateStaticParams() {
  const projects = await getProjects();
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProject(slug);
  if (!p) return { title: "Project not found" };
  const description = p.seoDescription ?? p.summary ?? `${p.title} — a ${p.layout.toLowerCase()} ${p.style.toLowerCase()} kitchen by Pantry LK.`;
  return pageMeta({ title: p.seoTitle ?? `${p.title} — ${p.layout} Kitchen`, description, path: `/our-works/${p.slug}`, image: { url: p.cover.src, alt: p.cover.alt }, type: "article" });
}

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [project, all, s] = await Promise.all([getProject(slug), getProjects(), getSettings()]);
  if (!project) notFound();

  const images = [project.cover, ...project.images];
  const related = all
    .filter((p) => p.slug !== project.slug)
    .sort((a, b) => Number(b.layout === project.layout) - Number(a.layout === project.layout))
    .slice(0, 3);
  const wa = whatsappHref(s.whatsappNumber, WA_MESSAGES.similarProject(project.title));
  const meta = [
    { k: "Layout", v: project.layout },
    { k: "Style", v: project.style },
    { k: "Project type", v: project.projectType },
    { k: "Location", v: project.location },
    { k: "Completed", v: project.completedOn },
  ].filter((m) => m.v);
  const hasStory = project.summary || project.requirements || project.solution;

  const crumbsLd = breadcrumbLd([
    { name: "Home", path: "/" },
    { name: "Our Works", path: "/our-works" },
    { name: project.title, path: `/our-works/${project.slug}` },
  ]);
  const projectLd = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: project.title,
    description: project.summary ?? undefined,
    image: [project.cover, ...project.images].map((i) => absUrl(i.src)),
    url: absUrl(`/our-works/${project.slug}`),
    creator: { "@id": BUSINESS_ID },
    ...(project.location ? { locationCreated: { "@type": "Place", name: project.location } } : {}),
  };

  return (
    <>
      <section className="wrap flex flex-col gap-5 pb-12 pt-16 md:pt-20">
        <nav aria-label="Breadcrumb" className="text-[13.5px] text-muted">
          <Link href="/" className="hover:text-navy">Home</Link> / <Link href="/our-works" className="hover:text-navy">Our Works</Link> /{" "}
          <span aria-current="page">{project.title}</span>
        </nav>
        <div className="flex flex-wrap items-end justify-between gap-8">
          <h1 className="display h-hero max-w-[980px]">{project.title}</h1>
          <Link href="/contact" className="btn btn-navy">Discuss a Similar Project</Link>
        </div>
        {meta.length > 0 && (
          <dl className="flex flex-wrap gap-x-7 gap-y-2 border-t border-line pt-4 text-[14.5px]">
            {meta.map((m) => (
              <div key={m.k} className="flex gap-1.5">
                <dt className="text-muted">{m.k}</dt>
                <dd>· {m.v}</dd>
              </div>
            ))}
          </dl>
        )}
      </section>

      <ProjectGallery title={project.title} images={images} />

      {(hasStory || project.materials.length > 0) && (
        <section className="wrap grid gap-x-24 gap-y-14 py-24 md:py-28 [grid-template-columns:repeat(auto-fit,minmax(min(420px,100%),1fr))]">
          <div className="flex flex-col gap-10">
            {project.summary && <p className="display text-[clamp(22px,2.2vw,30px)] leading-snug">{project.summary}</p>}
            {project.requirements && (
              <div className="flex flex-col gap-3.5">
                <p className="eyebrow">The brief</p>
                <p className="text-[17px] text-ink-2">{project.requirements}</p>
              </div>
            )}
            {project.solution && (
              <div className="flex flex-col gap-3.5">
                <p className="eyebrow">Challenges &amp; solutions</p>
                <p className="text-[17px] text-ink-2">{project.solution}</p>
              </div>
            )}
          </div>
          {project.materials.length > 0 && (
            <aside aria-label="Materials and finishes" className="flex flex-col gap-5 self-start border-t border-navy pt-6">
              <p className="eyebrow">Materials &amp; finishes</p>
              <dl className="grid grid-cols-[140px_1fr] gap-x-5 gap-y-3.5 text-[15px]">
                {project.materials.map((m) => (
                  <div key={m.label} className="contents">
                    <dt className="text-muted">{m.label}</dt>
                    <dd className="font-medium">{m.value}</dd>
                  </div>
                ))}
              </dl>
              <Link href="/products" className="tlink self-start">See finish options →</Link>
            </aside>
          )}
        </section>
      )}

      {project.before && project.after && (
        <section aria-labelledby="ba-h" className="wrap pb-24">
          <h2 id="ba-h" className="display h-lg mb-7">Before &amp; after</h2>
          <BeforeAfter before={project.before} after={project.after} />
        </section>
      )}

      <section className="bg-navy py-24 text-ivory">
        <div className="wrap flex flex-wrap items-center justify-between gap-8">
          <div className="flex max-w-[640px] flex-col gap-3.5">
            <h2 className="display h-xl">Want a kitchen like this?</h2>
            <p className="text-[18px] text-[#d9d4ca]">Share your space and we&apos;ll talk through layout, finishes and a quotation.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/contact" className="btn btn-light">Discuss a Similar Project</Link>
            <a href={wa} target="_blank" rel="noopener noreferrer" className="btn btn-ghost-light">WhatsApp Us</a>
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <section aria-labelledby="rel-h" className="wrap py-24 md:py-28">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <h2 id="rel-h" className="display h-lg">Related projects</h2>
            <Link href="/our-works" className="tlink">View All Projects →</Link>
          </div>
          <div className="grid gap-7 [grid-template-columns:repeat(auto-fit,minmax(min(300px,100%),1fr))]">
            {related.map((p) => <ProjectCard key={p.slug} project={p} />)}
          </div>
        </section>
      )}

      <script type="application/ld+json" dangerouslySetInnerHTML={ldJson([projectLd, crumbsLd])} />
    </>
  );
}
