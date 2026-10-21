import { BASE_BODY, BASE_D, BASE_WIDTHS, PLINTH, TOP_Y, WALL_D, WALL_H, WALL_TOP } from "./finishes";
import type { OpeningType, Product } from "./types";

const BASE = { group: "cabinets", layer: "base", mount: "wall", depth: BASE_D, height: PLINTH + BASE_BODY, elev: 0, plinth: PLINTH, worktop: true } as const;
const WALL = { group: "cabinets", layer: "wall", mount: "wall", depth: WALL_D, height: WALL_H, elev: WALL_TOP - WALL_H, plinth: 0 } as const;
const TALL = { group: "cabinets", layer: "tall", mount: "wall", depth: BASE_D, height: WALL_TOP, elev: 0, plinth: PLINTH } as const;
const STD = BASE_WIDTHS;

export const PRODUCTS: Product[] = [
  // Base cabinets: 750 high × 560 deep, standard widths 200 / 400 / 600 / 800
  { ...BASE, id: "base-corner-l", code: "BCL", name: "L-shaped corner base unit", desc: "Uses the full corner, with folding doors", subs: ["Base cabinets/For corner"], model: "cornerL", widths: [900], depth: 900, arm: BASE_D },
  { ...BASE, id: "base-corner", code: "BC", name: "Blind corner base unit", desc: "One door; the blind side runs under the next worktop", subs: ["Base cabinets/For corner"], model: "corner", widths: [800, 1000] },
  { ...BASE, id: "base-sink", code: "BS", name: "Sink base cabinet", desc: "Doors, with inset sink and mixer tap", subs: ["Base cabinets/For sink"], model: "sink", widths: [600, 800] },
  { ...BASE, id: "base-hob", code: "BH", name: "Cooktop base cabinet", desc: "3 drawers, with built-in hob", subs: ["Base cabinets/For cooktop"], model: "hob", widths: [600, 800], drawers: 3 },
  { ...BASE, id: "base-hob-oven", code: "BO", name: "Cooktop & oven cabinet", desc: "Built-in oven, hob and top drawer", subs: ["Base cabinets/For cooktop & oven"], model: "hobOven", widths: [600] },
  { ...BASE, id: "base-dishwasher", code: "DW", name: "Integrated dishwasher", desc: "Fully integrated, matching front", subs: ["Base cabinets/For dishwasher", "Appliances/Dishwashers"], model: "dishwasher", widths: [450, 600] },
  { ...BASE, id: "base-door", code: "B", name: "Base cabinet with doors", desc: "1 or 2 doors, adjustable shelf", subs: ["Base cabinets/With doors"], model: "doors", widths: STD },
  { ...BASE, id: "base-drawers-2", code: "BD2", name: "Base cabinet, 2 drawers", desc: "2 deep pan drawers", subs: ["Base cabinets/With drawers"], model: "drawers", drawers: 2, widths: [400, 600, 800] },
  { ...BASE, id: "base-drawers-3", code: "BD3", name: "Base cabinet, 3 drawers", desc: "1 shallow and 2 deep drawers", subs: ["Base cabinets/With drawers"], model: "drawers", drawers: 3, widths: [400, 600, 800] },
  { ...BASE, id: "base-drawers-4", code: "BD4", name: "Base cabinet, 4 drawers", desc: "2 shallow and 2 medium drawers", subs: ["Base cabinets/With drawers"], model: "drawers", drawers: 4, widths: [400, 600] },
  { ...BASE, id: "base-pullout", code: "BP", name: "Pull-out base cabinet", desc: "Narrow pull-out for bottles and spices", subs: ["Base cabinets/With pull-out"], model: "pullout", widths: [200] },
  { ...BASE, id: "base-open", code: "BOS", name: "Open base cabinet", desc: "Open shelves, no doors", subs: ["Base cabinets/Open cabinets"], model: "open", widths: [200, 400, 600] },

  // Wall cabinets: 750 high × 350 deep
  { ...WALL, id: "wall-corner-l", code: "WCL", name: "L-shaped corner wall unit", desc: "Fills the corner above an L-shaped base unit", subs: ["Wall cabinets/For corner"], model: "cornerL", widths: [900], depth: 900, arm: WALL_D },
  { ...WALL, id: "wall-door", code: "W", name: "Wall cabinet with doors", desc: "1 or 2 doors, 2 shelves", subs: ["Wall cabinets/With doors"], model: "doors", widths: STD },
  { ...WALL, id: "wall-glass", code: "WG", name: "Wall cabinet, glass doors", desc: "Framed glass doors for display", subs: ["Wall cabinets/With glass doors"], model: "glass", widths: [400, 600, 800] },
  { ...WALL, id: "wall-lift", code: "WH", name: "Horizontal wall cabinet", desc: "Lift-up front", subs: ["Wall cabinets/Horizontal cabinets"], model: "lift", widths: [600, 800], height: 400, elev: WALL_TOP - 400 },
  { ...WALL, id: "wall-lift-2", code: "WH2", name: "Horizontal wall cabinet, 2 fronts", desc: "Two stacked lift-up fronts", subs: ["Wall cabinets/Horizontal cabinets"], model: "lift", widths: [600, 800] },
  { ...WALL, id: "wall-open", code: "WO", name: "Open wall cabinet", desc: "Open shelves", subs: ["Wall cabinets/Open cabinets"], model: "open", widths: [200, 400, 600] },
  { ...WALL, id: "wall-fridge", code: "WF", name: "Wall cabinet above fridge", desc: "Deep cabinet with lift-up front", subs: ["Wall cabinets/Refrigerator cabinets"], model: "lift", widths: [600, 800], depth: BASE_D, height: 400, elev: WALL_TOP - 400 },
  { id: "hood-chimney", code: "HD", name: "Chimney extractor hood", desc: "Wall-mounted, stainless steel", group: "appliances", subs: ["Wall cabinets/For extractor hood", "Appliances/Extractor hoods"], layer: "wall", mount: "wall", model: "hood", widths: [600, 900], depth: 500, height: 620, elev: WALL_TOP - 620, plinth: 0, finish: "steel" },

  // High cabinets: 560 deep
  { ...TALL, id: "tall-oven", code: "HO", name: "High cabinet for oven", desc: "Built-in oven, drawer and top door", subs: ["High cabinets/For oven"], model: "tallOven", widths: [600] },
  { ...TALL, id: "tall-oven-micro", code: "HOM", name: "High cabinet for oven & microwave", desc: "Oven and microwave at eye level", subs: ["High cabinets/For oven & microwave"], model: "tallOvenMicro", widths: [600] },
  { ...TALL, id: "tall-fridge", code: "HF", name: "High cabinet for fridge & freezer", desc: "Integrated fridge-freezer", subs: ["High cabinets/For fridge & freezer"], model: "tallFridge", widths: [600] },
  { ...TALL, id: "tall-door", code: "H", name: "High cabinet with doors", desc: "Pantry storage, 5 shelves", subs: ["High cabinets/With doors"], model: "tallDoors", widths: [400, 600, 800] },
  { ...TALL, id: "tall-pullout", code: "HP", name: "High pantry pull-out", desc: "Wire baskets behind the doors", subs: ["High cabinets/With pull-out"], model: "tallPullout", widths: [400, 600] },

  // Appliances
  { id: "fridge", code: "RF", name: "Fridge-freezer", desc: "Freestanding, bottom freezer", group: "appliances", subs: ["Appliances/Fridges"], layer: "appliance", mount: "wall", model: "fridge", widths: [600, 700], depth: 680, height: 1850, elev: 0, plinth: 0, finish: "steel" },
  { id: "fridge-double", code: "RS", name: "Side-by-side fridge", desc: "Freestanding, double door", group: "appliances", subs: ["Appliances/Fridges"], layer: "appliance", mount: "wall", model: "fridgeDouble", widths: [900], depth: 700, height: 1780, elev: 0, plinth: 0, finish: "steel" },
  { id: "range", code: "RC", name: "Range cooker", desc: "Freestanding gas hob and oven", group: "appliances", subs: ["Appliances/Cooking"], layer: "appliance", mount: "wall", model: "range", widths: [600, 900], depth: 600, height: TOP_Y, elev: 0, plinth: 0, finish: "steel" },
  { id: "washer", code: "WM", name: "Washing machine", desc: "Front loader, fits under the worktop", group: "appliances", subs: ["Appliances/Laundry"], layer: "base", mount: "wall", model: "washer", widths: [600], depth: BASE_D, height: PLINTH + BASE_BODY, elev: 0, plinth: 0, worktop: true, finish: "white" },
  { id: "microwave", code: "MW", name: "Countertop microwave", desc: "Sits on the worktop", group: "appliances", subs: ["Appliances/Small appliances"], layer: "fixture", mount: "wall", model: "microwave", widths: [500], depth: 400, height: 300, elev: TOP_Y, plinth: 0, finish: "black" },

  // Dining
  { id: "table", code: "T", name: "Dining table", desc: "Rectangular, seats 4–6", group: "dining", subs: ["Dining/Tables"], layer: "free", mount: "free", model: "table", widths: [1200, 1400, 1600, 1800], depth: 800, height: 750, elev: 0, plinth: 0 },
  { id: "table-round", code: "TR", name: "Round dining table", desc: "Pedestal base", group: "dining", subs: ["Dining/Tables"], layer: "free", mount: "free", model: "roundTable", widths: [900, 1100], depth: 900, height: 750, elev: 0, plinth: 0 },
  { id: "chair", code: "C", name: "Dining chair", desc: "Upholstered seat", group: "dining", subs: ["Dining/Chairs"], layer: "free", mount: "free", model: "chair", widths: [450], depth: 500, height: 900, elev: 0, plinth: 0, solid: false },
  { id: "stool", code: "S", name: "Bar stool", desc: "For islands and breakfast bars", group: "dining", subs: ["Dining/Bar stools"], layer: "free", mount: "free", model: "stool", widths: [400], depth: 400, height: 750, elev: 0, plinth: 0, solid: false },

  // Kitchen extras
  { id: "shelf", code: "SH", name: "Floating wall shelf", desc: "Solid shelf on hidden brackets", group: "extras", subs: ["Kitchen extras/Shelves"], layer: "wall", mount: "wall", model: "shelf", widths: [600, 800, 1000, 1200], depth: 250, height: 30, elev: 1600, plinth: 0 },
  { id: "pendant", code: "L", name: "Pendant light", desc: "Hangs from the ceiling", group: "extras", subs: ["Kitchen extras/Lighting"], layer: "free", mount: "free", model: "pendant", widths: [300], depth: 300, height: 400, elev: 0, plinth: 0, solid: false, hang: 900 },
  { id: "led-strip", code: "LED", name: "LED strip light", desc: "Mount anywhere: under a shelf, in a niche, behind a TV unit", group: "extras", subs: ["Kitchen extras/Lighting"], layer: "fixture", mount: "wall", model: "ledStrip", widths: [600, 900, 1200, 1800, 2400], depth: 14, height: 10, elev: 1450, plinth: 0, solid: false },
  { id: "downlight", code: "DL", name: "Ceiling downlight", desc: "Recessed LED spotlight", group: "extras", subs: ["Kitchen extras/Lighting"], layer: "free", mount: "free", model: "downlight", widths: [90], depth: 90, height: 12, elev: 0, plinth: 0, solid: false, hang: 12 },
  { id: "bin", code: "WB", name: "Pedal bin", desc: "Freestanding waste bin", group: "extras", subs: ["Kitchen extras/Waste sorting"], layer: "free", mount: "free", model: "bin", widths: [300], depth: 300, height: 650, elev: 0, plinth: 0, solid: false },

  // Room elements (step 1)
  { id: "box", code: "X", name: "Box object", desc: "Resizable structure, e.g. a boxed-in pipe", group: "elements", subs: ["Elements/Structures"], layer: "free", mount: "free", model: "box", widths: [600], depth: 600, height: 900, elev: 0, plinth: 0, resizable: true },
  { id: "column", code: "CS", name: "Square column", desc: "Resizable, floor to ceiling", group: "elements", subs: ["Elements/Structures"], layer: "free", mount: "free", model: "column", widths: [300], depth: 300, height: 2400, elev: 0, plinth: 0, resizable: true, fullHeight: true },
  { id: "column-round", code: "CR", name: "Round column", desc: "Resizable, floor to ceiling", group: "elements", subs: ["Elements/Structures"], layer: "free", mount: "free", model: "columnRound", widths: [300], depth: 300, height: 2400, elev: 0, plinth: 0, resizable: true, fullHeight: true },
  { id: "socket", code: "E", name: "Double socket", desc: "Power outlet", group: "elements", subs: ["Elements/Electricity"], layer: "fixture", mount: "wall", model: "socket", widths: [146], depth: 12, height: 86, elev: 1060, plinth: 0, solid: false },
  { id: "switch", code: "ES", name: "Light switch", desc: "Wall switch", group: "elements", subs: ["Elements/Electricity"], layer: "fixture", mount: "wall", model: "switch", widths: [86], depth: 12, height: 86, elev: 1200, plinth: 0, solid: false },
  { id: "radiator", code: "RA", name: "Radiator", desc: "Panel radiator", group: "elements", subs: ["Elements/Heating"], layer: "fixture", mount: "wall", model: "radiator", widths: [600, 800, 1000], depth: 100, height: 600, elev: 150, plinth: 0 },
  { id: "vent", code: "V", name: "Ventilation grille", desc: "Wall vent", group: "elements", subs: ["Elements/Ventilation"], layer: "fixture", mount: "wall", model: "vent", widths: [200], depth: 20, height: 200, elev: 2300, plinth: 0, solid: false },
  { id: "water", code: "WP", name: "Water & drain point", desc: "Plumbing connection", group: "elements", subs: ["Elements/Fittings"], layer: "fixture", mount: "wall", model: "water", widths: [200], depth: 40, height: 120, elev: 450, plinth: 0, solid: false },
];

const map = new Map(PRODUCTS.map((p) => [p.id, p]));

/** Plan label such as "B60" or "BD3-60" (a dash keeps codes ending in a digit readable). */
export const itemCode = (p: Product, width: number) => (p.resizable ? p.code : `${p.code}${/\d$/.test(p.code) ? "-" : ""}${Math.round(width / 10)}`);
export const getProduct = (id: string) => map.get(id);

/** Catalog menu, mirroring the planner's mega-menus. */
export const MENUS: { group: Product["group"]; label: string; sections: { title: string; subs: string[] }[] }[] = [
  {
    group: "cabinets",
    label: "Cabinets",
    sections: [
      { title: "Base cabinets", subs: ["For corner", "For sink", "For cooktop", "For cooktop & oven", "For dishwasher", "With doors", "With drawers", "With pull-out", "Open cabinets"] },
      { title: "Wall cabinets", subs: ["For corner", "With doors", "With glass doors", "Horizontal cabinets", "For extractor hood", "Refrigerator cabinets", "Open cabinets"] },
      { title: "High cabinets", subs: ["For oven", "For oven & microwave", "For fridge & freezer", "With doors", "With pull-out"] },
    ],
  },
  { group: "appliances", label: "Appliances", sections: [{ title: "Appliances", subs: ["Fridges", "Cooking", "Extractor hoods", "Dishwashers", "Laundry", "Small appliances"] }] },
  { group: "dining", label: "Dining", sections: [{ title: "Dining", subs: ["Tables", "Chairs", "Bar stools"] }] },
  { group: "extras", label: "Kitchen extras", sections: [{ title: "Kitchen extras", subs: ["Shelves", "Lighting", "Waste sorting"] }] },
  { group: "elements", label: "Elements", sections: [{ title: "Elements", subs: ["Structures", "Electricity", "Heating", "Ventilation", "Fittings"] }] },
];

export const productsIn = (sub: string) => PRODUCTS.filter((p) => p.subs.includes(sub));

export const searchProducts = (q: string) => {
  const t = q.trim().toLowerCase();
  if (!t) return [];
  return PRODUCTS.filter((p) => `${p.name} ${p.desc} ${p.code} ${p.subs.join(" ")}`.toLowerCase().includes(t));
};

export type OpeningPreset = { id: string; type: OpeningType; name: string; width: number; height: number; sill: number };

export const OPENING_PRESETS: OpeningPreset[] = [
  { id: "window", type: "window", name: "Window", width: 1200, height: 1200, sill: 1000 },
  { id: "window-small", type: "window", name: "Small window", width: 600, height: 600, sill: 1300 },
  { id: "window-wide", type: "window", name: "Wide window", width: 1800, height: 1100, sill: 1000 },
  { id: "window-tall", type: "window", name: "Tall window", width: 900, height: 1900, sill: 200 },
  { id: "door", type: "door", name: "Door", width: 900, height: 2100, sill: 0 },
  { id: "door-double", type: "door", name: "Double door", width: 1500, height: 2100, sill: 0 },
  { id: "door-sliding", type: "door", name: "Sliding patio door", width: 1800, height: 2100, sill: 0 },
  { id: "opening", type: "opening", name: "Wall opening", width: 1000, height: 2100, sill: 0 },
  { id: "hatch", type: "opening", name: "Serving hatch", width: 1200, height: 800, sill: 1000 },
];

export const presetOf = (id: string) => OPENING_PRESETS.find((p) => p.id === id) ?? OPENING_PRESETS[0];
