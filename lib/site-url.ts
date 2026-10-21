export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");

// Canonical links, the sitemap and share previews all use SITE_URL, so a placeholder here would point
// search engines at the wrong domain.
if (process.env.NODE_ENV === "production" && /localhost|example\./.test(SITE_URL)) {
  console.warn(`\n[seo] NEXT_PUBLIC_SITE_URL is "${SITE_URL}". Set it to the real domain (e.g. https://www.pantrylk.lk) before deploying.\n`);
}
