"use client";

import dynamic from "next/dynamic";
import type { ContactProps } from "./Review";

// WebGL and browser storage only exist client-side, so the planner skips server rendering.
const KitchenPlanner = dynamic(() => import("./KitchenPlanner"), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-ivory" role="status">
      <div className="flex flex-col items-center gap-4">
        <span className="h-10 w-10 animate-spin rounded-full border-[3px] border-line border-t-navy" />
        <p className="text-[14px] font-semibold text-navy">Loading the Kitchen Planner…</p>
      </div>
    </div>
  ),
});

export default function PlannerLoader({ contact }: { contact: ContactProps }) {
  return <KitchenPlanner contact={contact} />;
}
