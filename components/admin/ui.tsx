"use client";

import { startTransition, useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { AlertIcon, CheckIcon, SpinnerIcon } from "@/components/Icons";
import { IDLE, type ActionState } from "@/lib/admin/form";

/**
 * Submit an editor through onSubmit rather than `<form action>`, so React doesn't reset the fields
 * when the server sends back a validation error.
 */
export function useAdminForm(fn: (prev: ActionState, form: FormData) => Promise<ActionState>) {
  const [state, action, pending] = useActionState<ActionState, FormData>(fn, IDLE);
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(() => action(fd));
  };
  const fields = state.status === "error" ? (state.fields ?? {}) : {};
  return { state, pending, onSubmit, fields };
}

export function SubmitButton({
  children,
  pending: pendingProp,
  pendingLabel = "Saving…",
  className = "btn btn-navy",
}: {
  children: React.ReactNode;
  pending?: boolean;
  pendingLabel?: string;
  className?: string;
}) {
  const status = useFormStatus();
  const pending = pendingProp ?? status.pending;
  return (
    <button type="submit" disabled={pending} className={className}>
      {pending && <SpinnerIcon className="motion-safe:animate-spin" />} {pending ? pendingLabel : children}
    </button>
  );
}

/** Success / error banner for an admin form. Moves focus to itself so screen readers announce it. */
export function FormMessage({ state }: { state: ActionState }) {
  const ref = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    if (state.status !== "idle") ref.current?.focus();
  }, [state]);
  if (state.status === "idle") return null;
  const ok = state.status === "ok";
  return (
    <p
      ref={ref}
      tabIndex={-1}
      role={ok ? "status" : "alert"}
      className={`flex items-start gap-2 border px-4 py-3 text-[14.5px] outline-none ${ok ? "border-success/40 bg-success/5 text-success" : "border-error/40 bg-error/5 text-error"}`}
    >
      {ok ? <CheckIcon size={18} className="mt-0.5 shrink-0" /> : <AlertIcon className="mt-1 shrink-0" />}
      {state.message}
    </p>
  );
}

export function Field({
  label,
  htmlFor,
  hint,
  error,
  children,
  className = "",
}: {
  label: string;
  htmlFor?: string;
  hint?: React.ReactNode;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="field-label">
        {label}
      </label>
      {children}
      {hint && !error && <p className="mt-1.5 text-[13px] text-muted">{hint}</p>}
      {error && (
        <p className="mt-1.5 flex items-center gap-1.5 text-[13.5px] text-error">
          <AlertIcon /> {error}
        </p>
      )}
    </div>
  );
}

/** A titled group of fields inside an editor. */
export function Section({ title, description, children }: { title: string; description?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="border border-line bg-white p-5 sm:p-6">
      <h2 className="text-[17px] font-bold">{title}</h2>
      {description && <p className="mt-1 text-[14px] text-muted">{description}</p>}
      <div className="mt-5 flex flex-col gap-5">{children}</div>
    </section>
  );
}

/** Turns "Tall Pull-Out Pantry" into "tall-pull-out-pantry". */
export function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
