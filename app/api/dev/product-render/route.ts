import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

/**
 * Development only: saves a rendered product photo into public/images/products.
 * Disabled in production builds and for anything but local requests.
 */
export async function POST(req: Request) {
  if (process.env.NODE_ENV === "production") return new Response("Not found", { status: 404 });
  const host = new URL(req.url).hostname;
  if (host !== "localhost" && host !== "127.0.0.1") return new Response("Forbidden", { status: 403 });

  const body = (await req.json().catch(() => null)) as { file?: unknown; data?: unknown } | null;
  const file = typeof body?.file === "string" ? body.file : "";
  const data = typeof body?.data === "string" ? body.data : "";
  const prefix = "data:image/jpeg;base64,";
  if (!/^[a-z0-9-]{1,80}$/.test(file) || !data.startsWith(prefix) || data.length > 15_000_000) {
    return new Response("Bad request", { status: 400 });
  }
  const dir = path.join(process.cwd(), "public", "images", "products");
  await mkdir(dir, { recursive: true });
  const bytes = Buffer.from(data.slice(prefix.length), "base64");
  await writeFile(path.join(dir, `${file}.jpg`), bytes);
  return Response.json({ ok: true, bytes: bytes.length });
}
