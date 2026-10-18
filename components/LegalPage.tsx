import Link from "next/link";
import type { ReactNode } from "react";

export default function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="wrap py-20 md:py-24">
      <nav aria-label="Breadcrumb" className="mb-5 text-[13.5px] text-muted"><Link href="/" className="hover:text-navy">Home</Link> / <span aria-current="page">{title}</span></nav>
      <article className="flex max-w-[720px] flex-col gap-5 text-[16.5px] leading-relaxed [&_h2]:mt-6 [&_h2]:text-[20px] [&_h2]:font-semibold [&_a]:font-semibold [&_a]:underline">
        <h1 className="display h-xl">{title}</h1>
        {children}
      </article>
    </section>
  );
}
