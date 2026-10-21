import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import { whatsappHref } from "@/lib/whatsapp";
import { ErrorNote, formatDate, PageHeader, StatusBadge } from "@/components/admin/Badges";
import { MailIcon, PhoneIcon, WhatsAppIcon } from "@/components/Icons";
import { NoteForm, StatusForm } from "../InquiryForms";

export const metadata: Metadata = { title: "Inquiry" };

type Note = { id: string; body: string; author_id: string | null; created_at: string };

export default async function InquiryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { sb, user } = await requireAdmin();

  const [{ data: r, error }, notes] = await Promise.all([
    sb.from("inquiries").select("*").eq("id", id).maybeSingle(),
    sb.from("inquiry_notes").select("id, body, author_id, created_at").eq("inquiry_id", id).order("created_at", { ascending: true }),
  ]);
  if (error) return <ErrorNote message={error.message} />;
  if (!r) notFound();

  const digits = String(r.phone).replace(/\D/g, "");
  const wa = digits.length >= 9 ? whatsappHref(digits.startsWith("0") ? `94${digits.slice(1)}` : digits, `Hello ${r.full_name}, this is Pantry LK about your inquiry ${r.ref}.`) : null;

  return (
    <>
      <PageHeader eyebrow={`Inquiry ${r.ref}`} title={r.full_name}>
        <StatusBadge status={r.status} />
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-6">
          <section className="border border-line bg-white p-5 sm:p-6">
            <dl className="grid gap-x-6 gap-y-2 text-[15px] sm:grid-cols-[140px_1fr]">
              <dt className="font-semibold">Received</dt>
              <dd>{formatDate(r.created_at)}</dd>
              <dt className="font-semibold">Type</dt>
              <dd>{r.inquiry_type}</dd>
              <dt className="font-semibold">Phone</dt>
              <dd>
                <a href={`tel:${r.phone}`} className="underline">
                  {r.phone}
                </a>
              </dd>
              {r.email && (
                <>
                  <dt className="font-semibold">Email</dt>
                  <dd className="break-all">
                    <a href={`mailto:${r.email}?subject=${encodeURIComponent(`Your Pantry LK inquiry ${r.ref}`)}`} className="underline">
                      {r.email}
                    </a>
                  </dd>
                </>
              )}
              {r.source_page && (
                <>
                  <dt className="font-semibold">Sent from</dt>
                  <dd className="break-all text-muted">{r.source_page}</dd>
                </>
              )}
            </dl>
            <h2 className="mt-6 text-[15px] font-semibold">Message</h2>
            <p className="mt-2 whitespace-pre-wrap text-[15.5px] leading-relaxed">{r.message}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a href={`tel:${r.phone}`} className="btn btn-outline min-h-10 px-4 text-[14px]">
                <PhoneIcon size={16} /> Call
              </a>
              {wa && (
                <a href={wa} target="_blank" rel="noopener noreferrer" className="btn btn-outline min-h-10 px-4 text-[14px]">
                  <WhatsAppIcon size={16} /> WhatsApp
                </a>
              )}
              {r.email && (
                <a href={`mailto:${r.email}`} className="btn btn-outline min-h-10 px-4 text-[14px]">
                  <MailIcon size={16} /> Email
                </a>
              )}
            </div>
          </section>

          <section className="border border-line bg-white p-5 sm:p-6">
            <h2 className="text-[17px] font-bold">Notes</h2>
            <p className="mt-1 text-[14px] text-muted">Private to admins. Keep a record of calls, visits and quotes.</p>
            {notes.error ? (
              <div className="mt-4">
                <ErrorNote message={notes.error.message} />
              </div>
            ) : (notes.data ?? []).length ? (
              <ol className="mt-5 flex flex-col gap-4">
                {(notes.data as Note[]).map((n) => (
                  <li key={n.id} className="border-l-2 border-gold pl-4">
                    <p className="text-[13px] text-muted">
                      {n.author_id === user.id ? "You" : "Another admin"} · {formatDate(n.created_at)}
                    </p>
                    <p className="mt-1 whitespace-pre-wrap text-[15px]">{n.body}</p>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="mt-4 text-[14.5px] text-muted">No notes yet.</p>
            )}
            <div className="mt-6 border-t border-line pt-6">
              <NoteForm inquiryId={id} />
            </div>
          </section>
        </div>

        <aside className="flex flex-col gap-6">
          <section className="border border-line bg-white p-5">
            <StatusForm id={id} status={r.status} />
          </section>
          <Link href="/admin/inquiries" className="tlink self-start text-[14px]">
            Back to inquiries
          </Link>
        </aside>
      </div>
    </>
  );
}
