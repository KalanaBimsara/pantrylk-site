/** Standard Pantry LK build heights (mm). */
export const PLINTH = 100;
export const BASE_BODY = 720;
export const TOP_T = 40;
export const TOP_Y = PLINTH + BASE_BODY + TOP_T; // 860 worktop surface
export const TOP_D = 620;
export const FRONT_T = 18;
export const WALL_T = 120;
export const WALL_TOP = 2180; // top line of wall and tall units

export type Surface = "wood" | "marble" | "speckle" | "plain";

export type Front = { id: string; name: string; color: string; rough: number; surface: Surface; grain?: string; shaker?: boolean };
export type Handle = { id: string; name: string; type: "bar" | "knob" | "edge" | "gola" | "none"; color: string; metal: number };
export type Worktop = { id: string; name: string; color: string; rough: number; surface: Surface; vein?: string };
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

export const WORKTOPS: Worktop[] = [
  { id: "white-quartz", name: "White Quartz", color: "#f2f1ee", rough: 0.25, surface: "speckle", vein: "#d8d6d0" },
  { id: "carrara", name: "Carrara Marble", color: "#eeeeec", rough: 0.2, surface: "marble", vein: "#9da1a6" },
  { id: "calacatta", name: "Calacatta Gold", color: "#f4f1ea", rough: 0.2, surface: "marble", vein: "#b8a27a" },
  { id: "black-granite", name: "Black Granite", color: "#1f2022", rough: 0.25, surface: "speckle", vein: "#5d5f63" },
  { id: "grey-stone", name: "Grey Stone", color: "#8d8d8a", rough: 0.5, surface: "speckle", vein: "#6f6f6c" },
  { id: "oak-block", name: "Oak Block", color: "#c39463", rough: 0.5, surface: "wood", vein: "#9b6f43" },
  { id: "walnut-block", name: "Walnut Block", color: "#6a4630", rough: 0.5, surface: "wood", vein: "#47301f" },
];

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
