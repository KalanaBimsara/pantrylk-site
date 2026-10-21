# pantrylk-site


## Kitchen Planner (`/kitchen-planner`)

A 3D kitchen planner modelled on the IKEA planner's three-step flow, built with three.js / React Three Fiber.

1. **Define your space** — room shape (rectangle, notched, angled) and size, ceiling height, windows / doors / wall openings, existing elements (columns, boxed pipes, sockets, radiators, vents, water points), floor and wall finishes.
2. **Make it yours** — catalog of base, wall and high cabinets, appliances, dining and extras. Click to add (items fill the walls automatically) or drag to move (snaps to walls and neighbours, red outline = no room). Modify width / fronts / handle, replace, open doors, set exact position, duplicate, remove. Global kitchen style for fronts, handles, worktop and cabinet sides; worktops are generated automatically over adjacent base units.
3. **Make it happen** — design review, generated floor plan and wall elevations, item list, notes, print, share link, save file, and "Send design to Pantry LK" (WhatsApp with the item list and a design link).

Views: Floor (2D plan), Wall (elevation), 3D orbit and Walk. Undo/redo, autosave in the browser with "Continue your design?", `.pantrylk.json` save/open, and share links (`#d=…`, deflate-compressed, validated with zod on load).

Code: `lib/planner/` (data model, catalog, finishes, geometry/snapping, store, review, sharing) and `components/planner/` (UI, SVG plans, `three/` scene and procedural models — no external 3D assets).

- **Catalog & finishes**: edit `lib/planner/catalog.ts` and `lib/planner/finishes.ts`.
- **Prices**: products have no `price`, so the planner shows "price on quotation". Set an indicative LKR `price` (for the first listed width) on every product to show live totals.
- Setting `kitchenPlannerUrl` in site settings still redirects to an external planner instead.
