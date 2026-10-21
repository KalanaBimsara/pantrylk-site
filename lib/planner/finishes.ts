/** Pantry LK standard unit sizes (mm). */
export const PLINTH = 100;
/** Base units: 750 high × 560 deep carcass, standard widths 200 / 400 / 600 / 800. */
export const BASE_BODY = 750;
export const BASE_D = 560;
export const BASE_WIDTHS = [200, 400, 600, 800];
export const WALL_H = 750;
export const WALL_D = 350;
export const TOP_T = 30;
export const TOP_Y = PLINTH + BASE_BODY + TOP_T; // 880 worktop surface
/** Base units sit on adjustable legs, so the worktop surface stays at TOP_Y whatever the top's thickness. */
export const plinthFor = (thickness: number) => TOP_Y - BASE_BODY - thickness;
/** Worktop depth: one standard 2 ft slab. */
export const TOP_D = 610;
export const FRONT_T = 18;
export const WALL_T = 120;
export const WALL_TOP = 2180; // top line of wall and tall units

export type Surface = "wood" | "marble" | "speckle" | "fine" | "plain";

export type Front = { id: string; name: string; color: string; rough: number; surface: Surface; grain?: string; shaker?: boolean };
export type Handle = { id: string; name: string; type: "bar" | "knob" | "edge" | "gola" | "none"; color: string; metal: number };
export type TopCategory = "Granite" | "Staron" | "Quartz" | "Marble" | "Timber" | "Laminate" | "Steel";
export type Worktop = {
  id: string; name: string; category: TopCategory; color: string; rough: number; surface: Surface; vein?: string; metal?: number;
  /** Usual finished edge thickness (mm). */
  thick: number;
  /** Indicative LKR per m². Leave unset to show "price on request". */
  price?: number;
};
export type FloorFinish = { id: string; name: string; color: string; pattern: "planks" | "tiles" | "terrazzo"; accent: string };

export const FRONTS: Front[] = [
  { id: "matte-white", name: "Matte White", color: "#f1efea", rough: 0.75, surface: "plain" },
  { id: "white-gloss", name: "White High-Gloss", color: "#f7f7f5", rough: 0.12, surface: "plain" },
  { id: "grey-gloss", name: "Grey High-Gloss", color: "#9a9c9d", rough: 0.12, surface: "plain" },
  { id: "light-grey", name: "Light Grey Matte", color: "#c9c8c3", rough: 0.7, surface: "plain" },
  { id: "anthracite", name: "Anthracite Matte", color: "#3b3d40", rough: 0.65, surface: "plain" },
  { id: "navy", name: "Pantry Navy", color: "#1f3550", rough: 0.6, surface: "plain" },
  { id: "sage", name: "Sage Green", color: "#8b9a7f", rough: 0.65, surface: "plain" },
  { id: "taupe", name: "Taupe", color: "#a99b88", rough: 0.6, surface: "plain" },
  { id: "white-shaker", name: "White Shaker", color: "#f0ede6", rough: 0.6, surface: "plain", shaker: true },
  { id: "sage-shaker", name: "Sage Shaker", color: "#8b9a7f", rough: 0.6, surface: "plain", shaker: true },
  { id: "natural-oak", name: "Natural Oak", color: "#c69c6d", rough: 0.55, surface: "wood", grain: "#a57a4c" },
  { id: "light-ash", name: "Light Ash", color: "#ddc7a5", rough: 0.55, surface: "wood", grain: "#c3a982" },
  { id: "dark-oak", name: "Smoked Oak", color: "#6e4f35", rough: 0.55, surface: "wood", grain: "#4f3623" },
  { id: "walnut", name: "Walnut", color: "#5b3b26", rough: 0.5, surface: "wood", grain: "#3e2616" },
];

export const HANDLES: Handle[] = [
  { id: "bar-steel", name: "Steel bar", type: "bar", color: "#b9bcbf", metal: 0.9 },
  { id: "bar-black", name: "Black bar", type: "bar", color: "#1d1d1f", metal: 0.4 },
  { id: "bar-gold", name: "Brushed brass bar", type: "bar", color: "#b5945a", metal: 0.9 },
  { id: "knob-brass", name: "Brass knob", type: "knob", color: "#b5945a", metal: 0.9 },
  { id: "knob-black", name: "Black knob", type: "knob", color: "#1d1d1f", metal: 0.4 },
  { id: "edge-gold", name: "Gold edge profile", type: "edge", color: "#b5945a", metal: 0.9 },
  { id: "gola", name: "Handleless (gola)", type: "gola", color: "#2a2a2a", metal: 0.3 },
  { id: "none", name: "Push-to-open", type: "none", color: "#000", metal: 0 },
];

export const TOP_CATEGORIES: { id: TopCategory; desc: string }[] = [
  { id: "Granite", desc: "Natural stone: heat and scratch resistant, polished finish." },
  { id: "Staron", desc: "Samsung Staron solid surface: seamless joins, non-porous, repairable." },
  { id: "Quartz", desc: "Engineered quartz: consistent pattern, very low maintenance." },
  { id: "Marble", desc: "Natural marble: classic veining; needs regular sealing." },
  { id: "Timber", desc: "Solid timber block: warm and natural; oil to maintain." },
  { id: "Laminate", desc: "High-pressure laminate: budget friendly, many prints." },
  { id: "Steel", desc: "Brushed stainless steel: hygienic, professional look." },
];

export const WORKTOPS: Worktop[] = [
  { id: "black-granite", name: "Black Galaxy Granite", category: "Granite", color: "#1f2022", rough: 0.22, surface: "speckle", vein: "#a8894f", thick: 30 },
  { id: "absolute-black", name: "Absolute Black Granite", category: "Granite", color: "#151617", rough: 0.15, surface: "speckle", vein: "#2b2c2e", thick: 30 },
  { id: "grey-stone", name: "Steel Grey Granite", category: "Granite", color: "#5f6264", rough: 0.25, surface: "speckle", vein: "#2f3133", thick: 30 },
  { id: "tan-brown", name: "Tan Brown Granite", category: "Granite", color: "#4a2f24", rough: 0.22, surface: "speckle", vein: "#1a1210", thick: 30 },
  { id: "kashmir-white", name: "Kashmir White Granite", category: "Granite", color: "#e6e1d8", rough: 0.25, surface: "speckle", vein: "#7d6a63", thick: 30 },
  { id: "staron-white", name: "Staron Bright White", category: "Staron", color: "#f6f6f3", rough: 0.35, surface: "plain", thick: 40 },
  { id: "staron-snow", name: "Staron Snow Speckle", category: "Staron", color: "#efeeea", rough: 0.35, surface: "fine", vein: "#b9b6ae", thick: 40 },
  { id: "staron-cream", name: "Staron Cream", category: "Staron", color: "#ece3d1", rough: 0.35, surface: "fine", vein: "#cdbf9f", thick: 40 },
  { id: "staron-grey", name: "Staron Grey Sand", category: "Staron", color: "#a9a8a3", rough: 0.35, surface: "fine", vein: "#76756f", thick: 40 },
  { id: "staron-charcoal", name: "Staron Charcoal", category: "Staron", color: "#3a3b3d", rough: 0.35, surface: "fine", vein: "#6a6b6d", thick: 40 },
  { id: "white-quartz", name: "Polar White Quartz", category: "Quartz", color: "#f2f1ee", rough: 0.2, surface: "speckle", vein: "#d8d6d0", thick: 20 },
  { id: "quartz-calacatta", name: "Calacatta-look Quartz", category: "Quartz", color: "#f4f3f0", rough: 0.18, surface: "marble", vein: "#8f949a", thick: 20 },
  { id: "quartz-concrete", name: "Concrete Grey Quartz", category: "Quartz", color: "#9b9a96", rough: 0.4, surface: "fine", vein: "#7f7e7a", thick: 20 },
  { id: "quartz-black", name: "Black Sparkle Quartz", category: "Quartz", color: "#18191b", rough: 0.15, surface: "speckle", vein: "#c9c9c9", thick: 20 },
  { id: "carrara", name: "Carrara Marble", category: "Marble", color: "#eeeeec", rough: 0.2, surface: "marble", vein: "#9da1a6", thick: 20 },
  { id: "calacatta", name: "Calacatta Gold Marble", category: "Marble", color: "#f4f1ea", rough: 0.2, surface: "marble", vein: "#b8a27a", thick: 20 },
  { id: "emperador", name: "Emperador Dark Marble", category: "Marble", color: "#4a3426", rough: 0.2, surface: "marble", vein: "#c8ad8c", thick: 20 },
  { id: "teak-block", name: "Teak Block", category: "Timber", color: "#9a6535", rough: 0.5, surface: "wood", vein: "#6e4421", thick: 40 },
  { id: "oak-block", name: "Oak Block", category: "Timber", color: "#c39463", rough: 0.5, surface: "wood", vein: "#9b6f43", thick: 40 },
  { id: "walnut-block", name: "Walnut Block", category: "Timber", color: "#6a4630", rough: 0.5, surface: "wood", vein: "#47301f", thick: 40 },
  { id: "laminate-white", name: "White Laminate", category: "Laminate", color: "#efefec", rough: 0.55, surface: "plain", thick: 30 },
  { id: "laminate-stone", name: "Grey Stone Laminate", category: "Laminate", color: "#8f8e8a", rough: 0.55, surface: "speckle", vein: "#6d6c69", thick: 30 },
  { id: "laminate-wood", name: "Light Wood Laminate", category: "Laminate", color: "#cfae84", rough: 0.6, surface: "wood", vein: "#b18e63", thick: 30 },
  { id: "stainless", name: "Brushed Stainless Steel", category: "Steel", color: "#c4c7c9", rough: 0.35, surface: "plain", metal: 0.9, thick: 30 },
];

export const TOP_THICKNESSES = [12, 20, 30, 40, 50, 60];

export const TOP_EDGES: { id: "square" | "eased" | "bevel" | "bullnose"; name: string; path: string }[] = [
  { id: "square", name: "Square", path: "M2 6h28v14H2z" },
  { id: "eased", name: "Eased", path: "M2 6h26q2 0 2 2v10q0 2-2 2H2z" },
  { id: "bevel", name: "Bevelled", path: "M2 6h23l5 5v9H2z" },
  { id: "bullnose", name: "Bullnose", path: "M2 6h21a7 7 0 0 1 0 14H2z" },
];

export const SPLASHES: { id: "none" | "low" | "full"; name: string; desc: string }[] = [
  { id: "none", name: "None", desc: "Tiles or paint on the wall" },
  { id: "low", name: "Upstand", desc: "100 mm strip in the worktop material" },
  { id: "full", name: "Full splashback", desc: "Up to the wall cabinets, cut around windows" },
];

/** Full splashback height: from the worktop up to the underside of standard wall units. */
export const SPLASH_FULL = WALL_TOP - WALL_H - TOP_Y;
export const SPLASH_LOW = 100;
export const SPLASH_T = 15;

// ---------------------------------------------------------------- lighting

export const LIGHT_COLORS = [
  { id: "warm", name: "Warm white", sub: "3000K", hex: "#ffc995" },
  { id: "natural", name: "Natural white", sub: "4000K", hex: "#ffe6c9" },
  { id: "cool", name: "Cool white", sub: "6000K", hex: "#eef3ff" },
  { id: "amber", name: "Amber", sub: "RGB", hex: "#ff9b38" },
  { id: "blue", name: "Blue", sub: "RGB", hex: "#4d8dff" },
  { id: "purple", name: "Purple", sub: "RGB", hex: "#a866ff" },
  { id: "green", name: "Green", sub: "RGB", hex: "#3fd98a" },
  { id: "red", name: "Red", sub: "RGB", hex: "#ff5050" },
];

export const LIGHT_ZONES: { id: "under" | "plinth" | "glass" | "cove" | "shelf"; name: string; desc: string }[] = [
  { id: "under", name: "Under wall cabinets", desc: "Task light across the worktop" },
  { id: "plinth", name: "Plinth / kickboard", desc: "Soft glow along the floor" },
  { id: "glass", name: "Inside glass cabinets", desc: "Lights the display shelves" },
  { id: "cove", name: "Above wall cabinets", desc: "Uplight towards the ceiling" },
  { id: "shelf", name: "Under floating shelves", desc: "A strip under each shelf" },
];

/** Indicative LKR per metre of LED strip. Leave unset to show "price on request". */
export const LED_PRICE_PER_M: number | undefined = undefined;

export const CARCASSES = [
  { id: "white", name: "White", color: "#efede8" },
  { id: "grey", name: "Grey", color: "#b9b9b6" },
  { id: "match", name: "Match fronts", color: "" },
];

export const FLOORS: FloorFinish[] = [
  { id: "light-oak", name: "Light oak planks", color: "#d6b98f", pattern: "planks", accent: "#b9966a" },
  { id: "walnut", name: "Walnut planks", color: "#7a553a", pattern: "planks", accent: "#5c3d27" },
  { id: "grey-tile", name: "Grey tiles", color: "#a9a9a6", pattern: "tiles", accent: "#8c8c89" },
  { id: "white-tile", name: "White tiles", color: "#ecebe7", pattern: "tiles", accent: "#cfcdc7" },
  { id: "terrazzo", name: "Terrazzo", color: "#e3ddd3", pattern: "terrazzo", accent: "#8f8578" },
];

export const WALL_COLORS = [
  { name: "Warm white", hex: "#f3f0ea" },
  { name: "Ivory", hex: "#f6f3ed" },
  { name: "Stone", hex: "#e2dbcf" },
  { name: "Pale grey", hex: "#d9dbdc" },
  { name: "Sage", hex: "#c9d0c0" },
  { name: "Sky", hex: "#d3dde6" },
  { name: "Terracotta", hex: "#d6a58b" },
  { name: "Navy", hex: "#30465f" },
];

export const byId = <T extends { id: string }>(list: T[], id: string | undefined): T => list.find((x) => x.id === id) ?? list[0];
