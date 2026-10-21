"use client";

import dynamic from "next/dynamic";

const RenderStudio = dynamic(() => import("./RenderStudio"), { ssr: false });

export default function RenderStudioLoader() {
  return <RenderStudio />;
}
