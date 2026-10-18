import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Anonymous, cookie-less Supabase client for reading PUBLIC content on the
 * server (published projects/products, public settings). Row Level Security
 * decides what this key can see — never put a service-role key here.
 */
let client: SupabaseClient | null | undefined;

export function getPublicSupabase(): SupabaseClient | null {
  if (client !== undefined) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    client = null;
    return client;
  }
  client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}

export function mediaUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith("/") || path.startsWith("http")) return path;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return base ? `${base}/storage/v1/object/public/site-media/${path}` : null;
}
