"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/inquiries", label: "Inquiries" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/projects", label: "Our Works" },
  { href: "/admin/settings", label: "Site settings" },
];

export default function AdminNav({ newInquiries }: { newInquiries: number }) {
  const path = usePathname();
  return (
    <nav aria-label="Admin" className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
      {LINKS.map((l) => {
        const active = l.href === "/admin" ? path === "/admin" : path === l.href || path.startsWith(`${l.href}/`);
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? "page" : undefined}
            className={`flex shrink-0 items-center justify-between gap-3 whitespace-nowrap px-3 py-2.5 text-[15px] font-semibold transition-colors ${
              active ? "bg-navy-2 text-ivory" : "text-on-dark-muted hover:bg-navy-2/60 hover:text-ivory"
            }`}
          >
            {l.label}
            {l.href === "/admin/inquiries" && newInquiries > 0 && (
              <span className="min-w-6 bg-gold px-1.5 text-center text-[12px] leading-5 text-navy" aria-label={`${newInquiries} new`}>
                {newInquiries}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
