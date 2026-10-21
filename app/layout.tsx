import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import SiteChrome from "@/components/SiteChrome";
import { getSettings } from "@/lib/content";
import { FACTORY } from "@/lib/business";
import { businessLd, ldJson, pageMeta, websiteLd } from "@/lib/seo";
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

const home = pageMeta({
  title: "Pantry LK — Custom Kitchen Pantries & Cabinetry in Sri Lanka",
  description:
    "Pantry LK designs and manufactures custom kitchen pantries, cabinets and storage at our factory in Bandaragama, Sri Lanka. Plan your kitchen in 3D, explore completed kitchens and get a quotation.",
  path: "/",
});

export const metadata: Metadata = {
  ...home,
  metadataBase: new URL(SITE_URL),
  title: { default: "Pantry LK — Custom Kitchen Pantries & Cabinetry in Sri Lanka", template: "%s | Pantry LK" },
  applicationName: "Pantry LK",
  authors: [{ name: "Pantry LK (Pvt) Ltd", url: SITE_URL }],
  creator: "Pantry LK (Pvt) Ltd",
  publisher: "Pantry LK (Pvt) Ltd",
  category: "Home & Garden",
  formatDetection: { telephone: true, address: true, email: true },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 } },
  // Search Console / Bing Webmaster verification codes, set in the hosting environment.
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || undefined,
    other: process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION ? { "msvalidate.01": process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION } : undefined,
  },
  other: { "geo.region": "LK-1", "geo.placename": "Bandaragama", "geo.position": `${FACTORY.lat};${FACTORY.lng}`, ICBM: `${FACTORY.lat}, ${FACTORY.lng}` },
};

export const viewport: Viewport = { themeColor: "#1c334d" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const s = await getSettings();
  const jsonLd = [businessLd(s), websiteLd()];

  return (
    <html lang="en-LK" className={`${archivo.variable} ${montserrat.variable}`}>
      <body>
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:bg-navy focus:px-4 focus:py-3 focus:text-ivory">
          Skip to content
        </a>
        <SiteChrome>
          <SiteHeader />
        </SiteChrome>
        <main id="main">{children}</main>
        <SiteChrome>
          <SiteFooter />
        </SiteChrome>
        <script type="application/ld+json" dangerouslySetInnerHTML={ldJson(jsonLd)} />
      </body>
    </html>
  );
}
