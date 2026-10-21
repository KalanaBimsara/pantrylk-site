import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";
import { INQUIRY_STATUSES } from "@/lib/admin/form";
import { EmptyState, ErrorNote, formatDate, PageHeader, StatusBadge } from "@/components/admin/Badges";

export const metadata: Metadata = { title: "Inquiries" };

const PER_PAGE = 50;

type Row = { id: string; ref: string; full_name: string; phone: string; email: string | null; inquiry_type: string; message: string; status: string; created_at: string };

export default async function InquiriesPage({ searchParams }: { searchParams: Promise<{ status?: string; q?: string; page?: string }> }) {
  const sp = await searchParams;
  const { sb } = await requireAdmin();
  const status = INQUIRY_STATUSES.includes(sp.status as never) ? sp.status : undefined;
  // Strip characters that have meaning in PostgREST filters.
  const q = (sp.q ?? "").replace(/[,()*%\\:"']/g, " ").trim().slice(0, 80);
  const page = Math.max(1, Number(sp.page) || 1);

  let query = sb
    .from("inquiries")
    .select("id, ref, full_name, phone, email, inquiry_type, message, status, created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range((page - 1) * PER_PAGE, page * PER_PAGE - 1);
  if (status) query = query.eq("status", status);
  else query = query.neq("status", "Archived");
  if (q) query = query.or(["full_name", "phone", "email", "ref"].map((c) => `${c}.ilike.%${q}%`).join(","));
  const { data, error, count } = await query;
  const rows = (data ?? []) as Row[];
  const pages = Math.max(1, Math.ceil((count ?? 0) / PER_PAGE));

  const href = (patch: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    const next = { status, q: q || undefined, ...patch };
    Object.entries(next).forEach(([k, v]) => v && p.set(k, v));
    const s = p.toString();
    return s ? `/admin/inquiries?${s}` : "/admin/inquiries";
  };

  return (
    <>
      <PageHeader eyebrow="Contact form" title="Inquiries" />

      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <nav aria-label="Filter by status" className="flex flex-wrap gap-1">
          {[{ label: "Open", value: undefined }, ...INQUIRY_STATUSES.map((s) => ({ label: s, value: s }))].map((t) => {
            const active = status === t.value;
            return (
              <Link
                key={t.label}
                href={href({ status: t.value, page: undefined })}
                aria-current={active ? "page" : undefined}
                className={`border px-3 py-1.5 text-[14px] font-semibold ${active ? "border-navy bg-navy text-ivory" : "border-line bg-white hover:border-navy"}`}
              >
                {t.label}
              </Link>
            );
          })}
        </nav>
        <form action="/admin/inquiries" className="flex gap-2">
          {status && <input type="hidden" name="status" value={status} />}
          <label htmlFor="q" className="sr-only">
            Search inquiries
          </label>
          <input id="q" name="q" defaultValue={q} placeholder="Name, phone, email or ref" className="field min-h-10 w-64 text-[15px]" />
          <button type="submit" className="btn btn-outline min-h-10 px-4 text-[14px]">
            Search
          </button>
        </form>
      </div>

      {error ? (
        <ErrorNote message={error.message} />
      ) : !rows.length ? (
        <EmptyState>{q ? `No inquiries match “${q}”.` : status ? `No ${status} inquiries.` : "No open inquiries. New contact-form messages appear here."}</EmptyState>
      ) : (
        <ul className="divide-y divide-line border border-line bg-white">
          {rows.map((r) => (
            <li key={r.id}>
              <Link href={`/admin/inquiries/${r.id}`} className="grid gap-1 px-4 py-3 hover:bg-ivory sm:grid-cols-[1fr_auto] sm:gap-4">
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2">
                    <span className={`font-semibold ${r.status === "New" ? "" : "text-ink-2"}`}>{r.full_name}</span>
                    <span className="text-[13px] text-muted">{r.inquiry_type}</span>
                  </p>
                  <p className="truncate text-[14px] text-muted">{r.message}</p>
                </div>
                <div className="flex items-center gap-3 text-[13px] text-muted sm:flex-col sm:items-end sm:gap-1">
                  <StatusBadge status={r.status} />
                  <span>{formatDate(r.created_at)}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {pages > 1 && (
        <nav aria-label="Pages" className="mt-6 flex items-center gap-3 text-[14px]">
          {page > 1 && (
            <Link href={href({ page: String(page - 1) })} className="btn btn-outline min-h-9 px-3 text-[13px]">
              Newer
            </Link>
          )}
          <span className="text-muted">
            Page {page} of {pages}
          </span>
          {page < pages && (
            <Link href={href({ page: String(page + 1) })} className="btn btn-outline min-h-9 px-3 text-[13px]">
              Older
            </Link>
          )}
        </nav>
      )}
    </>
  );
}
