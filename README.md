# pantrylk-site


## Kitchen Planner (`/kitchen-planner`)

A 3D kitchen planner modelled on the IKEA planner's three-step flow, built with three.js / React Three Fiber.

1. **Define your space** — room shape (rectangle, notched, angled) and size, ceiling height, windows / doors / wall openings, existing elements (columns, boxed pipes, sockets, radiators, vents, water points), floor and wall finishes.
2. **Make it yours** — catalog of base, wall and high cabinets, appliances, dining and extras. Click to add (items fill the walls automatically) or drag to move (snaps to walls and neighbours, red outline = no room). Modify width / fronts / handle, replace, open doors, set exact position, duplicate, remove. Global kitchen style for fronts, handles, worktop and cabinet sides; worktops are generated automatically over adjacent base units.
3. **Make it happen** — design review, generated floor plan and wall elevations, item list, notes, print, share link, save file, and "Send design to Pantry LK" (WhatsApp with the item list and a design link).

Views: Floor (2D plan), Wall (elevation), 3D orbit and Walk. Undo/redo, autosave in the browser with "Continue your design?", `.pantrylk.json` save/open, and share links (`#d=…`, deflate-compressed, validated with zod on load).

Code: `lib/planner/` (data model, catalog, finishes, geometry/snapping, store, review, sharing) and `components/planner/` (UI, SVG plans, `three/` scene and procedural models — no external 3D assets).

- **Catalog & finishes**: edit `lib/planner/catalog.ts` and `lib/planner/finishes.ts`.
- **Pantry tops** (toolbar › Pantry tops, or click a worktop): Granite, Staron solid surface, Quartz, Marble, Timber, Laminate and Stainless steel in `WORKTOPS` (`lib/planner/finishes.ts`), with thickness, edge profile (square / eased / bevel / bullnose) and backsplash (none / 100 mm upstand / full height, cut around windows). Set for the whole kitchen or per section; base-unit plinths adjust so the worktop stays at 860 mm.
- **Lights** (toolbar › Lights, or the moon button for an evening preview): LED strip zones (under / above wall cabinets, plinth, inside glass cabinets, under shelves), colour (warm / natural / cool white or RGB), brightness, per-cabinet on/off, plus LED strip, downlight and pendant items. Strip metres and tops (m², splashback m²) are added to the item list and the WhatsApp summary.
- **Standard sizes** (`lib/planner/finishes.ts`): base units 750 mm high × 560 mm deep on 100 mm adjustable legs, widths 200 / 400 / 600 / 800; wall units 750 × 350; worktops 610 mm (2 ft) deep. Corner units: L-shaped 900 × 900 (base and wall) and blind corner 800 / 1000.
- **Prices** (`lib/planner/pricing.ts`): cabinets LKR 7,100 per sq ft of front (width × height; an L corner unit counts the run it covers on both walls). Granite LKR 3,200 per sq ft, each slab side rounded up to whole feet (2.1 ft → 3 ft). Appliances, other worktop materials and LED strips stay "quoted separately" until a rate is set (`price` on a worktop, `LED_PRICE_PER_M`).
- **Layout lock**: the padlock (or L) stops units being moved, resized, added or removed; dragging then just turns the view, and finishes, tops and lights can still change.
- **Performance**: the 3D view renders on demand (nothing while idle), the shadow map is rebuilt only when the scene changes, glass avoids the extra transmission pass, and LED strips along a run share one area light.

## Standard units on the Products page

`lib/planner/site-products.ts` lists the standard base, wall and corner units shown on the Products page. Their sizes, prices and specs come from the planner catalog and pricing rules, and each product page has a live 3D view (`components/planner/ProductViewer.tsx`).

- Photos are rendered from the 3D models into `public/images/products`. To refresh them, run `npm run dev`, open `/dev/product-renders` and press **Render all photos** (development only; the page and its save endpoint return 404 in production).
- The products are in the seed content and in `supabase/migrations/0003_standard_units.sql` for the live database.
- Setting `kitchenPlannerUrl` in site settings still redirects to an external planner instead.
