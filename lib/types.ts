export type Img = { src: string; alt: string; caption?: string | null };

export type SiteSettings = {
  companyName: string;
  tagline: string;
  phoneDisplay: string;
  phoneIntl: string; // E.164, e.g. +94761528123
  whatsappNumber: string; // digits only, e.g. 94761528123
  email: string;
  address: string | null;
  businessHours: string | null;
  mapUrl: string | null;
  facebookUrl: string | null;
  instagramUrl: string | null;
  tiktokUrl: string | null;
  kitchenPlannerUrl: string | null;
  quotationMakerUrl: string | null;
  openAppsInNewTab: boolean;
  contactUploadsEnabled: boolean;
};

export type MaterialRow = { label: string; value: string };

export type Project = {
  slug: string;
  title: string;
  layout: string;
  style: string;
  projectType: string | null;
  location: string | null;
  completedOn: string | null;
  summary: string | null;
  requirements: string | null;
  solution: string | null;
  materials: MaterialRow[];
  cover: Img;
  images: Img[];
  before: Img | null;
  after: Img | null;
  featured: boolean;
  seoTitle: string | null;
  seoDescription: string | null;
};

export type PriceMode = "fixed" | "starting" | "on_request" | "none";

export type Finish = { name: string; hex: string };

export type Product = {
  slug: string;
  name: string;
  categorySlug: string;
  categoryName: string;
  summary: string;
  description: string;
  priceMode: PriceMode;
  price: number | null;
  finishes: Finish[];
  specs: MaterialRow[];
  images: Img[];
  featured: boolean;
  seoTitle: string | null;
  seoDescription: string | null;
};

export type Category = {
  slug: string;
  name: string;
  description: string;
  image: Img | null;
};

export type Testimonial = {
  id: string;
  quote: string;
  name: string;
  area: string | null;
  projectSlug: string | null;
};
