"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export default function NavLink({ href, external, newTab, children }: { href: string; external?: boolean; newTab?: boolean; children: ReactNode }) {
  const path = usePathname();
  const cls =
    "inline-flex items-center gap-1 border-b border-transparent py-1.5 text-[14.5px] font-medium transition-colors hover:border-gold aria-[current=page]:border-navy";
  if (external) {
    return (
      <a href={href} className={cls} {...(newTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
        {children}
      </a>
    );
  }
  const active = href === "/" ? path === "/" : path === href || path.startsWith(href + "/");
  return (
    <Link href={href} className={cls} aria-current={active ? "page" : undefined}>
      {children}
    </Link>
  );
}
