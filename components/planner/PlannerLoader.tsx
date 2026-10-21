"use client";

import dynamic from "next/dynamic";
import type { ContactProps } from "./Review";

// WebGL and browser storage only exist client-side, so the planner skips server rendering.
const KitchenPlanner = dynamic(() => import("./KitchenPlanner"), {
  ssr: false,
  // Shown (and server-rendered) while the 3D app loads, so the page has real content for everyone.
  loading: () => (
    <div className="fixed inset-0 z-[60] overflow-y-auto bg-ivory">
      <div className="mx-auto flex min-h-full max-w-[640px] flex-col items-center justify-center gap-5 px-6 py-12 text-center">
        <span className="h-10 w-10 animate-spin rounded-full border-[3px] border-line border-t-navy" aria-hidden="true" />
        <h1 className="display h-lg">Free 3D Kitchen Planner</h1>
        <p className="lead">
          Design your kitchen online with Pantry LK. Enter your room size, add our standard base, wall and corner cabinets, try granite and Staron
          tops and LED lighting, and see a live price estimate. Then send your plan to our team for a quotation.
        </p>
        <ul className="grid gap-1.5 text-[14.5px] text-ink-2 sm:grid-cols-2">
          <li>Floor plan, wall, 3D and walk-through views</li>
          <li>Standard sizes 200–800 mm and corner units</li>
          <li>Pantry tops: granite, Staron, quartz and more</li>
          <li>Prices from LKR 7,100 per sq ft of front</li>
        </ul>
        <p className="text-[14px] font-semibold text-navy" role="status">Loading the Kitchen Planner…</p>
        <noscript>
          <p className="text-[14px] text-error">The Kitchen Planner needs JavaScript. Please enable it, or contact us to plan your kitchen with our team.</p>
        </noscript>
      </div>
    </div>
  ),
});

export default function PlannerLoader({ contact }: { contact: ContactProps }) {
  return <KitchenPlanner contact={contact} />;
}
