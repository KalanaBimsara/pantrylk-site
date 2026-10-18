"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { CloseIcon, MenuIcon } from "./Icons";

type Item = { label: string; href: string; external: boolean; soon: boolean };

export default function MobileMenu({
  items,
  newTab,
  quoteHref,
  quoteExternal,
  whatsapp,
  phoneIntl,
}: {
  items: Item[];
  newTab: boolean;
  quoteHref: string;
  quoteExternal: boolean;
  whatsapp: string;
  phoneIntl: string;
}) {
  const [open, setOpen] = useState(false);
  const path = usePathname();
  const btn = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => setOpen(false), [path]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panel.current?.querySelector<HTMLElement>("a,button")?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        btn.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const ext = (external: boolean) => (external && newTab ? { target: "_blank", rel: "noopener noreferrer" } : {});

  return (
    <>
      <button
        ref={btn}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label={open ? "Close menu" : "Open menu"}
        className="inline-flex h-12 w-12 items-center justify-center rounded-[2px] border border-line hover:border-navy min-[1180px]:hidden"
      >
        {open ? <CloseIcon /> : <MenuIcon />}
      </button>
      {open && (
        <div
          id="mobile-menu"
          ref={panel}
          role="dialog"
          aria-modal="true"
          aria-label="Site menu"
          className="fade-in fixed inset-x-0 bottom-0 top-[76px] z-40 flex flex-col overflow-y-auto bg-ivory px-4 pb-6 pt-2 lg:top-[84px] min-[1180px]:hidden"
        >
          <nav aria-label="Mobile" className="flex flex-col">
            {items.map((i) => {
              const cls = "display flex min-h-[60px] items-center justify-between border-b border-line text-[24px]";
              const inner = (
                <>
                  <span>{i.label}</span>
                  {i.soon ? <span className="soon text-[11px]">Soon</span> : i.external ? <span className="text-base">↗</span> : null}
                </>
              );
              return i.external ? (
                <a key={i.label} href={i.href} className={cls} {...ext(true)}>
                  {inner}
                </a>
              ) : (
                <Link key={i.label} href={i.href} className={cls} aria-current={path === i.href ? "page" : undefined}>
                  {inner}
                </Link>
              );
            })}
          </nav>
          <div className="mt-auto flex flex-col gap-2.5 pt-8">
            <a href={quoteHref} {...ext(quoteExternal)} className="btn btn-navy">
              Get a Quotation
            </a>
            <div className="grid grid-cols-2 gap-2.5">
              <a href={`tel:${phoneIntl}`} className="btn btn-outline">
                Call
              </a>
              <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="btn btn-outline">
                WhatsApp
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
