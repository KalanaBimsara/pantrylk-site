import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";
import { formatDate, PageHeader, StatusBadge } from "@/components/admin/Badges";

export const metadata: Metadata = { title: "Dashboard" };

type Recent = { id: string; full_name: string; inquiry_type: string; status: string; created_at: string };

export default async function AdminHome() {
  const { sb } = await requireAdmin();
  const count = (table: string, filter?: [string, string]) => {
    const q = sb.from(table).select("id", { count: "exact", head: true });
    return filter ? q.eq(filter[0], filter[1]) : q;
  };
  const [newInq, products, liveProducts, projects, liveProjects, recent] = await Promise.all([
    count("inquiries", ["status", "New"]),
    count("products"),
    count("products", ["status", "published"]),
    count("projects"),
    count("projects", ["status", "published"]),
    sb.from("inquiries").select("id, full_name, inquiry_type, status, created_at").order("created_at", { ascending: false }).limit(5),
  ]);

  const missingTables = [newInq, products, projects].some((r) => r.error?.code === "42P01" || /does not exist/i.test(r.error?.message ?? ""));
  const cards = [
    { href: "/admin/inquiries?status=New", label: "New inquiries", value: newInq.count ?? 0, sub: "waiting for a reply" },
    { href: "/admin/products", label: "Products", value: liveProducts.count ?? 0, sub: `published of ${products.count ?? 0}` },
    { href: "/admin/projects", label: "Our Works", value: liveProjects.count ?? 0, sub: `published of ${projects.count ?? 0}` },
  ];

  return (
    <>
      <PageHeader eyebrow="Pantry LK" title="Dashboard" />
      {missingTables && (
        <p className="mb-6 border border-error/40 bg-error/5 px-4 py-3 text-[14.5px] text-error">
          The database tables are missing. Run the SQL files in <code>supabase/migrations</code> (0001 → latest) in the Supabase SQL editor.
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-3">
        {cards.map((c) => (
          <Link key={c.label} href={c.href} className="border border-line bg-white p-5 transition-colors hover:border-navy">
            <p className="eyebrow">{c.label}</p>
            <p className="display mt-2 text-[40px]">{c.value}</p>
            <p className="text-[14px] text-muted">{c.sub}</p>
          </Link>
        ))}
      </div>

      <section className="mt-10">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[17px] font-bold">Latest inquiries</h2>
          <Link href="/admin/inquiries" className="tlink text-[14px]">
            All inquiries
          </Link>
        </div>
        {(recent.data ?? []).length ? (
          <ul className="divide-y divide-line border border-line bg-white">
            {(recent.data as Recent[]).map((r) => (
              <li key={r.id}>
                <Link href={`/admin/inquiries/${r.id}`} className="flex flex-wrap items-center gap-3 px-4 py-3 hover:bg-ivory">
                  <span className="font-semibold">{r.full_name}</span>
                  <span className="text-[13px] text-muted">{r.inquiry_type}</span>
                  <span className="ml-auto flex items-center gap-3 text-[13px] text-muted">
                    {formatDate(r.created_at)} <StatusBadge status={r.status} />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="border border-dashed border-line bg-white px-4 py-6 text-[14.5px] text-muted">No inquiries yet.</p>
        )}
      </section>

      <section className="mt-10 grid gap-4 sm:grid-cols-3">
        {[
          { href: "/admin/products/new", label: "Add a product" },
          { href: "/admin/projects/new", label: "Add a completed kitchen" },
          { href: "/admin/settings", label: "Edit phone, email & links" },
        ].map((a) => (
          <Link key={a.href} href={a.href} className="btn btn-outline">
            {a.label}
          </Link>
        ))}
      </section>
    </>
  );
}
