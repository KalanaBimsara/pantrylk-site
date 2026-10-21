/** All planner dimensions are millimetres. The floor plane is (x, z); y is up. */
export type Vec2 = { x: number; z: number };

export type RoomShape =
  | { kind: "rect"; width: number; depth: number }
  | { kind: "notch"; width: number; depth: number; cutWidth: number; cutDepth: number }
  | { kind: "angled"; width: number; depth: number; chamfer: number };

export type Room = {
  shape: RoomShape;
  ceiling: number;
  floor: string;
  wallColor: string;
};

export type OpeningType = "window" | "door" | "opening";

export type Opening = {
  id: string;
  type: OpeningType;
  preset: string;
  wall: number;
  /** Distance from the wall's start to the opening centre. */
  offset: number;
  width: number;
  height: number;
  sill: number;
  /** Doors only: which side the hinge is on, seen from inside the room. */
  hinge?: "l" | "r";
};

export type Item = {
  id: string;
  product: string;
  x: number;
  z: number;
  rot: number;
  width: number;
  /** Resizable structures only. */
  depth?: number;
  height?: number;
  /** Bottom of the item above the floor; falls back to the product default. */
  elev?: number;
  front?: string;
  handle?: string;
  color?: string;
  mirror?: boolean;
  open?: boolean;
  /** Worktop override for the section this base unit belongs to. */
  top?: Partial<TopSpec>;
  /** LED strip override for this item; unset follows the kitchen lighting zones. */
  light?: "on" | "off";
};

export type TopEdge = "square" | "eased" | "bevel" | "bullnose";
export type Splash = "none" | "low" | "full";
export type TopSpec = { material: string; thickness: number; edge: TopEdge; splash: Splash };

export type LightZone = "under" | "plinth" | "glass" | "cove" | "shelf";
export type Lighting = {
  mode: "day" | "evening";
  color: string;
  /** 0.2 – 1.5 */
  brightness: number;
  zones: Record<LightZone, boolean>;
};

export type KitchenStyle = {
  front: string;
  handle: string;
  /** Worktop material id. */
  worktop: string;
  carcass: string;
  topThickness: number;
  topEdge: TopEdge;
  splash: Splash;
};

export type Design = {
  v: 1;
  name: string;
  room: Room;
  openings: Opening[];
  items: Item[];
  style: KitchenStyle;
  lighting: Lighting;
  notes: string;
};

export type Layer = "base" | "wall" | "tall" | "appliance" | "free" | "fixture";

export type ModelId =
  | "doors"
  | "drawers"
  | "sink"
  | "hob"
  | "hobOven"
  | "dishwasher"
  | "corner"
  | "open"
  | "pullout"
  | "glass"
  | "lift"
  | "hood"
  | "tallDoors"
  | "tallPullout"
  | "tallOven"
  | "tallOvenMicro"
  | "tallFridge"
  | "fridge"
  | "fridgeDouble"
  | "range"
  | "washer"
  | "microwave"
  | "table"
  | "roundTable"
  | "chair"
  | "stool"
  | "shelf"
  | "pendant"
  | "bin"
  | "box"
  | "column"
  | "columnRound"
  | "socket"
  | "switch"
  | "radiator"
  | "vent"
  | "water"
  | "ledStrip"
  | "downlight"
  | "cornerL";

export type Product = {
  id: string;
  code: string;
  name: string;
  desc: string;
  group: "cabinets" | "appliances" | "dining" | "extras" | "elements";
  /** Catalog locations, "Section/Subsection". */
  subs: string[];
  layer: Layer;
  mount: "wall" | "free";
  model: ModelId;
  widths: number[];
  depth: number;
  height: number;
  elev: number;
  plinth: number;
  worktop?: boolean;
  /** Takes part in collision checks (default true). */
  solid?: boolean;
  /** Height follows the ceiling. */
  fullHeight?: boolean;
  /** Hangs this far below the ceiling (pendant lights). */
  hang?: number;
  resizable?: boolean;
  drawers?: number;
  /** L-shaped corner units: depth of each arm (the footprint is width × depth). */
  arm?: number;
  /** Fixed appliance finish; otherwise the kitchen front finish is used. */
  finish?: "steel" | "white" | "black";
  /** Indicative LKR price for the first width. Leave unset to show "price on request". */
  price?: number;
};

export type View = "plan" | "elevation" | "3d" | "walk";

/** "top" selects the worktop section that contains the item with this id. */
export type Selection = { type: "item" | "opening" | "wall" | "top"; id: string } | null;

export type Panel =
  | { kind: "catalog"; group: Product["group"]; sub: string }
  | { kind: "search"; query?: string }
  | { kind: "selected"; tab: "modify" | "position" | "replace" }
  | { kind: "room" }
  | { kind: "surfaces" }
  | { kind: "openings"; type: OpeningType }
  | { kind: "style" }
  | { kind: "tops" }
  | { kind: "lights" }
  | { kind: "list" }
  | null;
