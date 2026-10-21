"use client";

import { usePathname } from "next/navigation";

/** Renders the public header/footer everywhere except the admin area, which has its own shell. */
export default function SiteChrome({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  if (path === "/admin" || path?.startsWith("/admin/")) return null;
  return <>{children}</>;
}
