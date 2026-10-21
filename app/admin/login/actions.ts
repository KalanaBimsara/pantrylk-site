"use server";

import { redirect } from "next/navigation";
import { getServerSupabase } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin/auth";
import { fail, text, type ActionState } from "@/lib/admin/form";

/** Only follow `next` back into the admin area (no open redirects). */
function safeNext(v: string | null): string {
  return v && v.startsWith("/admin") && !v.startsWith("//") && !v.startsWith("/admin/login") ? v : "/admin";
}

export async function signIn(_prev: ActionState, form: FormData): Promise<ActionState> {
  const email = text(form, "email");
  const password = String(form.get("password") ?? "");
  if (!email || !password) return fail("Enter your email and password.");

  const sb = await getServerSupabase();
  if (!sb) return fail("Supabase isn't configured on this site (NEXT_PUBLIC_SUPABASE_URL / PUBLISHABLE_KEY).");

  const { error } = await sb.auth.signInWithPassword({ email, password });
  if (error) {
    if (/invalid api key|apikey/i.test(error.message)) return fail("The Supabase publishable key in the site's environment is invalid.");
    if (/email not confirmed/i.test(error.message)) return fail("This email address hasn't been confirmed yet. Confirm it from the email Supabase sent, or in the Supabase dashboard.");
    return fail("That email and password don't match an account.");
  }

  if (!(await isAdmin(sb))) {
    await sb.auth.signOut();
    return fail("This account isn't an admin. Ask the site owner to give it admin access (see README).");
  }

  redirect(safeNext(text(form, "next")));
}

export async function signOut() {
  const sb = await getServerSupabase();
  await sb?.auth.signOut();
  redirect("/admin/login");
}
