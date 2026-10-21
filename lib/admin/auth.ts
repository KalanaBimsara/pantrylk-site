import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { getServerSupabase } from "@/lib/supabase/server";

export type AdminContext = { sb: SupabaseClient; user: User };

/** True when the signed-in user's profile has is_admin = true (the same check RLS policies use). */
export async function isAdmin(sb: SupabaseClient): Promise<boolean> {
  const { data, error } = await sb.rpc("is_admin");
  return !error && data === true;
}

/**
 * Gate for every admin page and server action. Signed-out users and non-admins are sent to the
 * sign-in page. Queries made with the returned client run under RLS as this user.
 */
export const requireAdmin = cache(async (): Promise<AdminContext> => {
  const sb = await getServerSupabase();
  if (!sb) redirect("/admin/login?error=config");
  const { data } = await sb.auth.getUser();
  if (!data.user) redirect("/admin/login");
  if (!(await isAdmin(sb))) redirect("/admin/login?error=not-admin");
  return { sb, user: data.user };
});
