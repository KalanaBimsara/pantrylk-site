import type { Metadata } from "next";
import { FACTORY } from "./business";
import { SITE_URL } from "./site-url";
import type { SiteSettings } from "./types";

const SITE_NAME = "Pantry LK";
const DEFAULT_IMAGE = { url: "/opengraph-image.jpg", width: 1200, height: 630, alt: "A Pantry LK custom kitchen" };

/**
 * Page metadata with canonical URL, Open Graph and Twitter card in one place. (Next.js replaces a
 * parent's openGraph object rather than merging it, so every page sets the full set.)
 */
export function pageMeta({ title, description, path, image, type = "website", noindex = false, absoluteTitle = false }: {
  title: string;
  /** Use the title as-is instead of "Title | Pantry LK". */
  absoluteTitle?: boolean;
  description: string;
  path: string;
  image?: { url: string; alt: string } | null;
  type?: "website" | "article";
  noindex?: boolean;
}): Metadata {
  const images = image ? [{ url: image.url, alt: image.alt }] : [DEFAULT_IMAGE];
  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: { canonical: path },
    openGraph: { type, siteName: SITE_NAME, locale: "en_LK", url: path, title, description, images },
    twitter: { card: "summary_large_image", title, description, images: images.map((i) => i.url) },
    ...(noindex ? { robots: { index: false, follow: true } } : {}),
  };
}

export const absUrl = (src: string) => (src.startsWith("http") ? src : `${SITE_URL}${src.startsWith("/") ? "" : "/"}${src}`);

export const BUSINESS_ID = `${SITE_URL}/#business`;

/** LocalBusiness structured data: name, address and pin match the Google Maps listing. */
export function businessLd(s: SiteSettings) {
  return {
    "@context": "https://schema.org",
    "@type": ["HomeAndConstructionBusiness", "FurnitureStore"],
    "@id": BUSINESS_ID,
    name: s.companyName,
    alternateName: [SITE_NAME, FACTORY.name],
    description: s.tagline,
    url: SITE_URL,
    logo: absUrl("/brand/logo.png"),
    image: absUrl(DEFAULT_IMAGE.url),
    telephone: s.phoneIntl,
    email: s.email,
    priceRange: "LKR",
    currenciesAccepted: "LKR",
    address: {
      "@type": "PostalAddress",
      streetAddress: FACTORY.street,
      addressLocality: FACTORY.locality,
      addressRegion: FACTORY.region,
      postalCode: FACTORY.postalCode,
      addressCountry: FACTORY.country,
    },
    geo: { "@type": "GeoCoordinates", latitude: FACTORY.lat, longitude: FACTORY.lng },
    hasMap: s.mapUrl ?? FACTORY.mapUrl,
    areaServed: { "@type": "Country", name: "Sri Lanka" },
    knowsAbout: ["Kitchen cabinets", "Pantry cupboards", "Custom kitchens", "Wall cabinets", "Granite worktops", "Kitchen design"],
    sameAs: [s.facebookUrl, s.instagramUrl, s.tiktokUrl, FACTORY.mapUrl].filter(Boolean),
  };
}

export function websiteLd() {
  return { "@context": "https://schema.org", "@type": "WebSite", "@id": `${SITE_URL}/#website`, name: SITE_NAME, url: SITE_URL, inLanguage: "en-LK", publisher: { "@id": BUSINESS_ID } };
}

export function breadcrumbLd(trail: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((t, i) => ({ "@type": "ListItem", position: i + 1, name: t.name, item: absUrl(t.path) })),
  };
}

/** Serialises structured data safely for a <script type="application/ld+json"> tag. */
export const ldJson = (data: unknown) => ({ __html: JSON.stringify(data).replace(/</g, "\\u003c") });
