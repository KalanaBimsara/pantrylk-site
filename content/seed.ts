/**
 * Fallback content used ONLY when Supabase is not configured or its tables
 * are not reachable yet. Once the migration in /supabase is applied and the
 * admin publishes content, the website reads from the database instead.
 *
 * Photos come from the "Pantry images" folder supplied by Pantry LK.
 * Nothing here invents locations, dates, prices, reviews or specifications:
 * those fields are null and the pages hide them.
 */
import { unitProducts } from "@/lib/planner/unit-products";
import type { Category, Product, Project, SiteSettings } from "@/lib/types";

const img = (file: string, alt: string, caption?: string) => ({ src: `/images/${file}.jpg`, alt, caption: caption ?? null });

export const seedSettings: SiteSettings = {
  companyName: "Pantry LK Pvt Ltd",
  tagline: "Custom kitchen pantries and cabinetry, designed and manufactured in Sri Lanka.",
  phoneDisplay: "076 152 8123",
  phoneIntl: "+94761528123",
  whatsappNumber: "94761528123",
  email: "pantrylk2026@gmail.com",
  address: null,
  businessHours: null,
  mapUrl: null,
  facebookUrl: null,
  instagramUrl: null,
  tiktokUrl: null,
  kitchenPlannerUrl: null, // coming soon
  quotationMakerUrl: "https://pantrylk-quotation.netlify.app/",
  openAppsInNewTab: true,
  contactUploadsEnabled: false,
};

const p = (
  slug: string,
  title: string,
  layout: string,
  style: string,
  cover: ReturnType<typeof img>,
  images: ReturnType<typeof img>[],
  extra: Partial<Project> = {},
): Project => ({
  slug,
  title,
  layout,
  style,
  projectType: null,
  location: null,
  completedOn: null,
  summary: null,
  requirements: null,
  solution: null,
  materials: [],
  cover,
  images,
  before: null,
  after: null,
  featured: false,
  seoTitle: null,
  seoDescription: null,
  ...extra,
});

export const seedProjects: Project[] = [
  p(
    "grey-gloss-island-kitchen",
    "Grey Gloss Island Kitchen",
    "Island",
    "Contemporary",
    img("island-grey-oak", "Grey high-gloss kitchen with integrated tall units, a black angled hood and an oak-finish island"),
    [
      img("island-grey-oak-2", "Wide view of the island with bar stools and the grey gloss run behind"),
      img("grey-gloss-fridge", "Tall units with a built-in fridge housing and lit shelf niche"),
      img("gloss-hood-detail", "Close-up of grey gloss wall units, hood and linear lighting"),
    ],
    {
      featured: true,
      summary: "Grey high-gloss wall and tall units paired with a warm oak-finish island.",
      materials: [
        { label: "Wall & tall units", value: "Grey high-gloss fronts" },
        { label: "Island", value: "Oak-finish panelling, stone-look top" },
        { label: "Lighting", value: "Linear LED under wall units" },
      ],
    },
  ),
  p(
    "charcoal-oak-u-shaped-kitchen",
    "Charcoal & Oak U-Shaped Kitchen",
    "U-shaped",
    "Two-tone",
    img("dark-oak-u-kitchen", "U-shaped kitchen with charcoal tall units, oak-finish wall cabinets and a white worktop"),
    [],
    { featured: true },
  ),
  p(
    "timber-ceiling-l-shaped-kitchen",
    "Timber-Ceiling L-Shaped Kitchen",
    "L-shaped",
    "Warm contemporary",
    img("vaulted-l-kitchen", "L-shaped kitchen with taupe cabinets under a sloping timber ceiling"),
    [img("vaulted-l-kitchen-2", "Breakfast counter and taupe cabinets with under-cabinet lighting")],
    { featured: true },
  ),
  p(
    "sage-green-kitchen",
    "Sage Green Kitchen",
    "L-shaped",
    "Colour-led",
    img("green-kitchen", "Kitchen with sage green cabinets, open timber shelving and a dark stone island"),
    [],
    { featured: true },
  ),
  p(
    "classic-white-island-kitchen",
    "Classic White Island Kitchen",
    "Island",
    "Classic",
    img("classic-white-island", "Classic white shaker-style kitchen with an island cooktop and built-in ovens"),
    [],
    { featured: true },
  ),
  p(
    "oak-grey-kitchen-glass-tower",
    "Oak & Grey Kitchen with Glass Tower",
    "Straight run",
    "Contemporary",
    img("oak-grey-glass-tall", "Kitchen with oak-finish base units, grey wall cabinets and a lit glass tall unit"),
    [img("oak-base-units", "Oak-finish handleless base drawers under a white worktop")],
  ),
  p(
    "timber-ceiling-u-kitchen",
    "Timber-Ceiling U-Kitchen",
    "U-shaped",
    "Warm contemporary",
    img("vaulted-u-kitchen", "U-shaped kitchen with white stone worktops and a window above the sink, under a timber ceiling"),
    [],
  ),
  p(
    "white-gloss-appliance-wall",
    "White Gloss Appliance Wall",
    "Tall storage",
    "Minimal",
    img("white-tall-ovens", "White gloss tall units housing a fridge and stacked ovens"),
    [],
  ),
  p(
    "storage-wall-with-wine-rack",
    "Storage Wall with Wine Rack",
    "Tall storage",
    "Natural oak",
    img("storage-wall-wine", "Storage wall with an oak sliding panel, glass side cabinets and a wine rack"),
    [],
  ),
  p(
    "grey-gloss-kitchen-fridge-housing",
    "Grey Gloss Kitchen with Fridge Housing",
    "Straight run",
    "Contemporary",
    img("grey-gloss-fridge", "Grey gloss kitchen with built-in fridge housing and lit shelf niche"),
    [],
  ),
  p(
    "white-oak-island-kitchen",
    "White & Oak Island Kitchen",
    "Island",
    "Light & natural",
    img("white-oak-kitchen", "White kitchen with an oak-finish wall niche and island base"),
    [],
  ),
];

export const seedCategories: Category[] = [
  { slug: "pantry-units", name: "Custom pantry units", description: "Pull-out and shelved storage sized to your space.", image: img("pantry-pullout", "Open tall pantry with pull-out wire storage baskets") },
  { slug: "base-cabinets", name: "Base cabinets", description: "Drawers and cupboards that carry the worktop.", image: img("oak-base-units", "Oak-finish base cabinets with handleless drawers") },
  { slug: "wall-cabinets", name: "Wall cabinets", description: "Solid, glass and open options above the counter.", image: img("glass-wall-units", "Black-framed glass wall cabinets above a stone backsplash") },
  { slug: "tall-pantry-cabinets", name: "Tall pantry cabinets", description: "Floor-to-ceiling storage and appliance housings.", image: img("white-tall-ovens", "White gloss tall units housing a fridge and stacked ovens") },
  { slug: "drawer-systems", name: "Drawer systems", description: "Deep drawers and organisers for pots and pans.", image: null },
  { slug: "islands-peninsulas", name: "Islands & peninsulas", description: "A working and gathering point at the centre.", image: img("island-grey-oak-2", "Kitchen island with stone-finish top and oak-finish panelling") },
];

const cat = (slug: string) => seedCategories.find((c) => c.slug === slug)!;

const product = (
  slug: string,
  name: string,
  categorySlug: string,
  summary: string,
  description: string,
  images: ReturnType<typeof img>[],
  extra: Partial<Product> = {},
): Product => ({
  slug,
  name,
  categorySlug,
  categoryName: cat(categorySlug).name,
  summary,
  description,
  priceMode: "on_request",
  price: null,
  finishes: [],
  specs: [{ label: "Dimensions", value: "Made to measure" }],
  images,
  featured: false,
  seoTitle: null,
  seoDescription: null,
  ...extra,
});

export const seedProducts: Product[] = [
  product(
    "tall-pull-out-pantry",
    "Tall Pull-Out Pantry",
    "pantry-units",
    "Full-height pull-out baskets, sized to your gap.",
    "A full-height pantry with pull-out baskets, so tins, jars and dry goods at the back are as easy to reach as those at the front. Built to the width and height of your space.",
    [img("pantry-pullout", "Tall pantry open, showing pull-out wire baskets on each level")],
    { featured: true, specs: [{ label: "Dimensions", value: "Made to measure" }, { label: "Internal fittings", value: "Pull-out wire baskets" }] },
  ),
  product(
    "handleless-base-drawer-unit",
    "Handleless Base Drawer Unit",
    "base-cabinets",
    "Deep drawers with recessed grip rails.",
    "Base drawers with a clean handleless front, sized to sit under your worktop and hold pots, pans and everyday items.",
    [img("oak-base-units", "Oak-finish handleless base drawers")],
  ),
  product(
    "framed-glass-wall-cabinet",
    "Framed Glass Wall Cabinet",
    "wall-cabinets",
    "Slim dark frames with glass fronts.",
    "Wall cabinets with slim framed glass doors that keep glassware visible and the kitchen feeling open.",
    [img("glass-wall-units", "Black-framed glass wall cabinets")],
    { priceMode: "none" },
  ),
  product(
    "gloss-wall-cabinet-run",
    "Gloss Wall Cabinet Run",
    "wall-cabinets",
    "High-gloss fronts with under-cabinet lighting.",
    "A run of high-gloss wall cabinets with integrated lighting beneath, built around your hood and appliances.",
    [img("gloss-hood-detail", "Grey gloss wall cabinets with hood and linear lighting")],
  ),
  product(
    "appliance-tall-housing",
    "Appliance Tall Housing",
    "tall-pantry-cabinets",
    "Built-in housing for fridge and stacked ovens.",
    "Floor-to-ceiling units that frame your fridge and ovens, with storage above and beside.",
    [img("white-tall-ovens", "White gloss tall units housing a fridge and ovens")],
    { priceMode: "none" },
  ),
  product(
    "lit-glass-display-tower",
    "Lit Glass Display Tower",
    "tall-pantry-cabinets",
    "Glass doors with integrated shelf lighting.",
    "A tall glass-fronted unit with lit shelves for display pieces, glassware or a home bar.",
    [img("lit-glass-cabinet", "Lit glass display cabinet with slim frame")],
  ),
  product(
    "storage-wall-with-wine-rack",
    "Storage Wall with Wine Rack",
    "tall-pantry-cabinets",
    "Sliding centre panel, glass sides, wine rack.",
    "A full storage wall combining a sliding centre panel, glass side cabinets, a wine rack and closed cupboards below.",
    [img("storage-wall-wine", "Storage wall with sliding oak panel and wine rack")],
  ),
  product(
    "kitchen-island-unit",
    "Kitchen Island Unit",
    "islands-peninsulas",
    "Storage below, seating to one side.",
    "A made-to-measure island with storage below the worktop and space for seating.",
    [img("island-grey-oak-2", "Kitchen island with oak-finish panelling and stools")],
    { priceMode: "none", featured: true },
  ),
  // Standard units, with photos rendered from the Kitchen Planner models and prices from Pantry LK's rates.
  ...unitProducts((slug) => cat(slug).name),
];
