import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSupabase } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin/auth";
import LoginForm from "./LoginForm";

export const metadata: Metadata = { title: "Sign in" };

const NOTICES: Record<string, string> = {
  "not-admin": "That account doesn't have admin access. Sign in with an admin account.",
  config: "Supabase isn't configured on this site, so the admin can't be used yet.",
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const { next, error } = await searchParams;

  const sb = await getServerSupabase();
  if (sb) {
    const { data } = await sb.auth.getUser();
    if (data.user && (await isAdmin(sb))) redirect("/admin");
  }

  const notice = error ? NOTICES[error] : sb ? null : NOTICES.config;

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-[420px]">
        <Link href="/" aria-label="Pantry LK — home" className="mb-8 inline-block">
          <Image src="/brand/logo.png" alt="" width={1152} height={422} priority className="h-12 w-auto" />
        </Link>
        <div className="border border-line bg-white p-6 sm:p-8">
          <p className="eyebrow">Admin</p>
          <h1 className="display h-md mt-2">Sign in</h1>
          <p className="mt-2 text-[15px] text-ink-2">For Pantry LK staff. Manage products, projects, settings and inquiries.</p>
          <LoginForm next={next ?? ""} notice={notice} />
        </div>
        <p className="mt-6 text-center text-[14px] text-muted">
          <Link href="/" className="tlink">
            Back to the website
          </Link>
        </p>
      </div>
    </div>
  );
}
