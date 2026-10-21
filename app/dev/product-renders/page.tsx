import type { Metadata } from "next";
import { notFound } from "next/navigation";
import RenderStudioLoader from "@/components/planner/RenderStudioLoader";

export const metadata: Metadata = { title: "Product renders", robots: { index: false, follow: false } };

/** Development-only tool that renders the product photos from the planner's 3D models. */
export default function ProductRendersPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <RenderStudioLoader />;
}
