import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { getSettings } from "@/lib/content";
import { SITE_URL } from "@/lib/site-url";
import "./globals.css";

// Self-hosted variable fonts (SIL OFL — see app/fonts/OFL-LICENSES.txt). No build-time call to Google.
const archivo = localFont({
  src: "./fonts/archivo-latin-wdth.woff2",
  variable: "--font-archivo",
  weight: "100 900",
  style: "normal",
  display: "swap",
  declarations: [{ prop: "font-stretch", value: "62% 125%" }],
  fallback: ["Arial Black", "system-ui", "sans-serif"],
});
const montserrat = localFont({
  src: "./fonts/montserrat-latin.woff2",
  variable: "--font-montserrat",
  weight: "100 900",
  style: "normal",
  display: "swap",
  fallback: ["system-ui", "Segoe UI", "sans-serif"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "Pantry LK — Custom Kitchen Pantries & Cabinetry in Sri Lanka", template: "%s | Pantry LK" },
  description:
    "Pantry LK designs and manufactures custom kitchen pantries, cabinets and storage in Sri Lanka. Explore completed kitchens and request a quotation.",
  openGraph: { type: "website", siteName: "Pantry LK", locale: "en_LK" },
  alternates: { canonical: "/" },
};

export const viewport: Viewport = { themeColor: "#1c334d" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const s = await getSettings();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "HomeAndConstructionBusiness",
    name: s.companyName,
    url: SITE_URL,
    logo: `${SITE_URL}/brand/logo.png`,
    telephone: s.phoneIntl,
    email: s.email,
    areaServed: "LK",
    ...(s.address ? { address: s.address } : {}),
    sameAs: [s.facebookUrl, s.instagramUrl, s.tiktokUrl].filter(Boolean),
  };
  return (
    <html lang="en-LK" className={`${archivo.variable} ${montserrat.variable}`}>
      <body>
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:bg-navy focus:px-4 focus:py-3 focus:text-ivory">
          Skip to content
        </a>
        <SiteHeader />
        <main id="main">{children}</main>
        <SiteFooter />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      </body>
    </html>
  );
}
