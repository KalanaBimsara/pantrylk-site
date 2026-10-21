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

## SEO

- `NEXT_PUBLIC_SITE_URL` **must be the real domain** in production: canonical links, the sitemap, `robots.txt` and share previews are built from it (the build prints a warning while it is a placeholder).
- `lib/seo.ts` gives every page its title, description, canonical, Open Graph and Twitter card (`pageMeta`), plus structured data: LocalBusiness with the Bandaragama factory address and map pin (`lib/business.ts`, matching the Google Maps listing), WebSite, Product with LKR offers, BreadcrumbList, CreativeWork for projects and WebApplication for the planner.
- `app/sitemap.ts` lists every page, product and project with images; `app/robots.ts` keeps `/admin`, `/api/` and `/dev/` out of search.
- Optional verification codes: `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` (Search Console) and `NEXT_PUBLIC_BING_SITE_VERIFICATION` (Bing Webmaster Tools).
- `supabase/migrations/0004_factory_address.sql` stores the factory address and map link in site settings.

## Admin panel (`/admin`)

A sign-in-protected area for staff to manage **Inquiries** (contact-form messages: status and private notes), **Products** (create, edit, publish/unpublish, reorder, photos with alt text, specs, finishes, price), **Categories**, **Our Works** projects and **Site settings** (phone, WhatsApp, email, address, map link, hours, social links, planner/quotation links). It has its own layout (no public header/footer) and is `noindex`.

### First-time setup

1. **Run the migrations** in the Supabase SQL editor, in order: `0001_init.sql`, `0002_seed.sql`, `0003_standard_units.sql`, `0004_factory_address.sql`, `0005_admin_media.sql`. (A "relation public.products does not exist" error means 0001 hasn't been run yet.)
2. **Check `.env.local`** (and your host's environment variables) has `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` from Supabase › Project Settings › API Keys. If sign-in says the key is invalid, copy the publishable (or legacy `anon`) key again and restart `npm run dev`.
3. **Create your login**: Supabase › Authentication › Users › **Add user › Create new user**, enter your email and a strong password, and tick **Auto Confirm User**. (There's no public sign-up page on the site, on purpose.)
4. **Make that user an admin**: copy the user's **UID** from the Users list, then in the SQL editor run:

   ```sql
   insert into public.profiles (id, is_admin) values ('<auth user id>', true)
   on conflict (id) do update set is_admin = true;
   ```

5. Open `/admin` and sign in. Any account without `is_admin = true` is signed straight back out with "This account isn't an admin".

To remove someone's access, run `update public.profiles set is_admin = false where id = '<auth user id>';` (or delete the user in Supabase › Authentication). Forgotten passwords are reset from Supabase › Authentication › Users (… › Send password recovery, or set a new password).

### How it's secured

- `proxy.ts` refreshes the Supabase session cookie on `/admin` requests and sends signed-out visitors to `/admin/login`.
- `app/admin/(panel)/layout.tsx`, every admin page and every admin server action call `requireAdmin()` (`lib/admin/auth.ts`), which checks `public.is_admin()` for the signed-in user.
- All reads and writes use the signed-in user's session with the **publishable key** (`lib/supabase/server.ts`, `lib/supabase/browser.ts`), so the Row Level Security policies in `0001_init.sql` have the final say. No service-role key is used anywhere — never add one to a `NEXT_PUBLIC_` variable.
- Images are uploaded from the browser straight to the public `site-media` storage bucket under `products/`, `projects/` and `categories/`; storage policies only allow admins to upload. `0005_admin_media.sql` limits uploads to JPG/PNG/WebP/AVIF up to 10 MB. Removing an image from a product doesn't delete the file from storage.
- Saving anything refreshes the public pages straight away (`revalidatePath`); otherwise they refresh every 5 minutes.

### Things to know

- **Standard units** (the slugs in `lib/planner/site-products.ts`, e.g. `standard-base-cabinet`): their price and specs on the website always come from the planner pricing rules (`withUnitDetails` in `lib/planner/unit-products.ts`), so the product editor shows them read-only. Name, text, photos, finishes, status and order are editable as normal.
- **Projects** can only be published once **Photos verified** is ticked and a cover photo is set (a database rule): only show genuine Pantry LK installations that the homeowner agreed to share.
- Blank phone, WhatsApp, email, address and map link settings fall back to the built-in defaults in `content/seed.ts`.
