import Image from "next/image";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";
import AdminNav from "@/components/admin/AdminNav";
import { ArrowUpRight } from "@/components/Icons";
import { signOut } from "../login/actions";

export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  const { sb, user } = await requireAdmin();
  const { count } = await sb.from("inquiries").select("id", { count: "exact", head: true }).eq("status", "New");

  return (
    <div className="lg:grid lg:min-h-screen lg:grid-cols-[240px_1fr]">
      <aside className="bg-navy text-on-dark lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col">
        <div className="flex items-center justify-between gap-4 px-4 py-4 lg:block lg:px-5 lg:py-6">
          <Link href="/admin" className="flex items-center gap-3">
            <Image src="/brand/logo.png" alt="Pantry LK" width={1152} height={422} className="h-8 w-auto brightness-0 invert" />
            <span className="eyebrow text-gold-light">Admin</span>
          </Link>
        </div>
        <div className="px-2 pb-3 lg:flex-1 lg:px-3">
          <AdminNav newInquiries={count ?? 0} />
        </div>
        <div className="hidden border-t border-white/10 px-5 py-5 text-[13px] lg:block">
          <p className="truncate text-on-dark-muted" title={user.email ?? ""}>
            {user.email}
          </p>
          <div className="mt-3 flex items-center justify-between gap-3">
            <Link href="/" target="_blank" className="inline-flex items-center gap-1 font-semibold text-ivory hover:text-gold-light">
              View site <ArrowUpRight size={10} />
            </Link>
            <form action={signOut}>
              <button type="submit" className="font-semibold text-ivory hover:text-gold-light">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </aside>
      <div className="min-w-0">
        <div className="flex items-center justify-end gap-4 border-b border-line bg-white px-4 py-2 text-[13px] lg:hidden">
          <span className="truncate text-muted">{user.email}</span>
          <form action={signOut}>
            <button type="submit" className="font-semibold text-navy underline">
              Sign out
            </button>
          </form>
        </div>
        <div className="mx-auto w-full max-w-[1100px] px-4 py-8 sm:px-6 lg:px-10 lg:py-10">{children}</div>
      </div>
    </div>
  );
}
