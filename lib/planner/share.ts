"use client";

import { parseDesign } from "./store";
import type { Design } from "./types";

const toB64Url = (bytes: Uint8Array) => {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};
const fromB64Url = (s: string) => {
  const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
};

async function pipe(bytes: Uint8Array, stream: CompressionStream | DecompressionStream) {
  const out = new Response(new Blob([bytes as BlobPart]).stream().pipeThrough(stream));
  return new Uint8Array(await out.arrayBuffer());
}

/** Compact the design into a URL-safe string (deflate + base64url). */
export async function encodeDesign(d: Design) {
  const json = new TextEncoder().encode(JSON.stringify(d));
  if (typeof CompressionStream === "undefined") return "j" + toB64Url(json);
  return "z" + toB64Url(await pipe(json, new CompressionStream("deflate-raw")));
}

export async function decodeDesign(s: string): Promise<Design | null> {
  try {
    const bytes = fromB64Url(s.slice(1));
    const json = s[0] === "z" ? await pipe(bytes, new DecompressionStream("deflate-raw")) : bytes;
    return parseDesign(JSON.parse(new TextDecoder().decode(json)));
  } catch {
    return null;
  }
}

export async function shareLink(d: Design) {
  return `${location.origin}/kitchen-planner#d=${await encodeDesign(d)}`;
}

export function download(name: string, href: string) {
  const a = document.createElement("a");
  a.href = href;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "kitchen";

export function saveFile(d: Design) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(d, null, 1)], { type: "application/json" }));
  download(`${slug(d.name)}.pantrylk.json`, url);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function openFile(): Promise<Design | null> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json,application/json";
    input.onchange = async () => {
      const f = input.files?.[0];
      if (!f || f.size > 2_000_000) return resolve(null);
      try {
        resolve(parseDesign(JSON.parse(await f.text())));
      } catch {
        resolve(null);
      }
    };
    input.click();
  });
}

export const fileSlug = slug;
