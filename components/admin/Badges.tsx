const STATUS_STYLES: Record<string, string> = {
  published: "border-success/40 bg-success/10 text-success",
  draft: "border-line bg-stone text-ink-2",
  unpublished: "border-gold/50 bg-gold/10 text-gold-deep",
  archived: "border-line bg-white text-muted",
  New: "border-gold/60 bg-gold/15 text-gold-deep",
  Contacted: "border-navy-2/30 bg-navy-2/10 text-navy-2",
  "In Progress": "border-navy-2/30 bg-navy-2/10 text-navy-2",
  Completed: "border-success/40 bg-success/10 text-success",
  Archived: "border-line bg-white text-muted",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center whitespace-nowrap border px-2 py-0.5 text-[12px] font-semibold capitalize ${STATUS_STYLES[status] ?? STATUS_STYLES.draft}`}>
      {status}
    </span>
  );
}

export function PageHeader({ eyebrow, title, children }: { eyebrow?: string; title: string; children?: React.ReactNode }) {
  return (
    <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1 className="display h-md mt-1 text-[clamp(24px,2.4vw,32px)]">{title}</h1>
      </div>
      {children && <div className="flex flex-wrap items-center gap-3">{children}</div>}
    </header>
  );
}

export function EmptyState({ children }: { children: React.ReactNode }) {
  return <div className="border border-dashed border-line bg-white px-6 py-10 text-center text-[15px] text-muted">{children}</div>;
}

export function ErrorNote({ message }: { message: string }) {
  return <p className="border border-error/40 bg-error/5 px-4 py-3 text-[14.5px] text-error">Couldn't load from the database: {message}</p>;
}

export const formatDate = (iso: string) =>
  new Intl.DateTimeFormat("en-LK", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Colombo" }).format(new Date(iso));
