import Link from "next/link";
import type { ReactNode } from "react";

export default function PageIntro({ crumbs, title, lead }: { crumbs: { label: string; href?: string }[]; title: ReactNode; lead?: ReactNode }) {
  return (
    <section className="wrap grid items-end gap-x-20 gap-y-8 pb-14 pt-20 md:pt-24 [grid-template-columns:repeat(auto-fit,minmax(min(440px,100%),1fr))]">
      <div className="flex flex-col gap-5">
        <nav aria-label="Breadcrumb" className="text-[13.5px] text-muted">
          <ol className="flex flex-wrap gap-1.5">
            {crumbs.map((c, i) => (
              <li key={c.label} className="flex gap-1.5">
                {i > 0 && <span aria-hidden="true">/</span>}
                {c.href ? <Link href={c.href} className="hover:text-navy">{c.label}</Link> : <span aria-current="page">{c.label}</span>}
              </li>
            ))}
          </ol>
        </nav>
        <h1 className="display h-hero">{title}</h1>
      </div>
      {lead && <p className="lead max-w-[560px]">{lead}</p>}
    </section>
  );
}
