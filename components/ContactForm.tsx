"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState, startTransition } from "react";
import { submitInquiry } from "@/app/contact/actions";
import { fieldErrors, INQUIRY_TYPES, inquirySchema, type InquiryField, type InquiryState } from "@/lib/inquiry-schema";
import { AlertIcon, CheckIcon, SpinnerIcon } from "./Icons";

type Values = Record<InquiryField, string>;
const empty: Values = { full_name: "", phone: "", email: "", inquiry_type: "", message: "" };

function FieldError({ id, msg }: { id: string; msg?: string }) {
  if (!msg) return null;
  return (
    <p id={id} className="mt-2 flex items-center gap-1.5 text-[14px] text-error">
      <AlertIcon /> {msg}
    </p>
  );
}

export default function ContactForm({
  whatsappHref,
  defaultType,
  sourcePage,
}: {
  whatsappHref: string;
  defaultType?: string;
  sourcePage?: string;
}) {
  const [state, action, pending] = useActionState<InquiryState, FormData>(submitInquiry, { status: "idle" });
  const [values, setValues] = useState<Values>({ ...empty, inquiry_type: INQUIRY_TYPES.includes(defaultType as never) ? (defaultType as string) : "" });
  const [clientErrors, setClientErrors] = useState<Partial<Record<InquiryField, string>>>({});
  const [tried, setTried] = useState(false);
  const [startedAt] = useState(() => Date.now());
  const summaryRef = useRef<HTMLDivElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const serverErrors = state.status === "invalid" ? state.errors : {};
  const errors = tried ? { ...serverErrors, ...clientErrors } : serverErrors;
  const errorCount = Object.values(errors).filter(Boolean).length;

  useEffect(() => {
    if (state.status === "success") resultRef.current?.focus();
    if (state.status === "failed" || state.status === "limited" || state.status === "invalid") summaryRef.current?.focus();
  }, [state]);

  const set = (k: InquiryField) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const next = { ...values, [k]: e.target.value };
    setValues(next);
    if (tried) setClientErrors(fieldErrors(inquirySchema.safeParse(next)));
  };

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setTried(true);
    const errs = fieldErrors(inquirySchema.safeParse(values));
    setClientErrors(errs);
    if (Object.keys(errs).length) {
      requestAnimationFrame(() => summaryRef.current?.focus());
      return;
    }
    const fd = new FormData(e.currentTarget);
    startTransition(() => action(fd));
  }

  if (state.status === "success") {
    return (
      <div ref={resultRef} tabIndex={-1} role="status" className="flex flex-col gap-5 py-6 outline-none">
        <span className="inline-flex h-14 w-14 items-center justify-center border border-success text-success">
          <CheckIcon size={26} />
        </span>
        <h2 className="display h-lg">Thank you, {state.firstName}. We&apos;ve received your message.</h2>
        <p className="max-w-[560px] text-[17px] text-ink-2">
          Our team will contact you on <strong className="font-semibold">{state.phone}</strong> to talk through your kitchen. Your reference is{" "}
          <strong className="font-semibold tabular-nums">{state.ref}</strong>.
        </p>
        <p className="text-[15px] text-muted">While you wait, you can browse completed kitchens.</p>
        <div className="flex flex-wrap gap-3">
          <Link href="/our-works" className="btn btn-navy">Explore Our Work</Link>
          <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="btn btn-outline">Message us on WhatsApp</a>
        </div>
      </div>
    );
  }

  const describedBy = (k: string, extra?: string) => [errors[k as InquiryField] ? `${k}-error` : "", extra ?? ""].filter(Boolean).join(" ") || undefined;

  return (
    <form noValidate onSubmit={onSubmit} aria-labelledby="form-h" className="flex flex-col gap-6">
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <h2 id="form-h" className="display h-md !text-[28px]">Send us a message</h2>
        <span className="text-[13.5px] text-muted"><span className="text-error">*</span> Required</span>
      </div>

      <div ref={summaryRef} tabIndex={-1} className="outline-none">
        {errorCount > 0 && (
          <div role="alert" className="border border-[#e5b8af] bg-[#fbedea] px-4 py-3.5 text-[15px] text-[#6e2419]">
            <strong className="font-semibold">Please check {errorCount === 1 ? "1 field" : `${errorCount} fields`} before sending.</strong>
          </div>
        )}
        {state.status === "failed" && (
          <div role="alert" className="flex flex-col gap-1 border border-[#e5b8af] bg-[#fbedea] px-4 py-3.5 text-[15px] text-[#6e2419]">
            <strong className="font-semibold">Your message wasn&apos;t sent.</strong>
            <span>
              Something went wrong on our side. Your details are still here — try again, or{" "}
              <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="font-semibold underline">reach us on WhatsApp</a>.
            </span>
          </div>
        )}
        {state.status === "limited" && (
          <div role="alert" className="flex flex-col gap-1 border border-[#e3c99a] bg-[#faf1e1] px-4 py-3.5 text-[15px] text-[#5c3d0a]">
            <strong className="font-semibold">We couldn&apos;t accept that just now.</strong>
            <span>
              Please wait a few minutes and try again, or{" "}
              <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="font-semibold underline">message us on WhatsApp</a> instead.
            </span>
          </div>
        )}
      </div>

      {/* Spam traps (hidden from people and assistive tech) */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label>Website<input type="text" name="website" tabIndex={-1} autoComplete="off" defaultValue="" /></label>
      </div>
      <input type="hidden" name="started_at" value={startedAt} />
      <input type="hidden" name="source_page" value={sourcePage ?? "/contact"} />

      <div className="grid gap-5 [grid-template-columns:repeat(auto-fit,minmax(min(240px,100%),1fr))]">
        <div>
          <label className="field-label" htmlFor="full_name">Full name <span className="text-error" aria-hidden="true">*</span></label>
          <input id="full_name" name="full_name" className="field" autoComplete="name" required value={values.full_name} onChange={set("full_name")} aria-invalid={!!errors.full_name} aria-describedby={describedBy("full_name")} />
          <FieldError id="full_name-error" msg={errors.full_name} />
        </div>
        <div>
          <label className="field-label" htmlFor="phone">Phone number <span className="text-error" aria-hidden="true">*</span></label>
          <input id="phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="07X XXX XXXX" required className="field" value={values.phone} onChange={set("phone")} aria-invalid={!!errors.phone} aria-describedby={describedBy("phone")} />
          <FieldError id="phone-error" msg={errors.phone} />
        </div>
      </div>
      <div className="grid gap-5 [grid-template-columns:repeat(auto-fit,minmax(min(240px,100%),1fr))]">
        <div>
          <label className="field-label" htmlFor="email">Email address <span className="font-normal text-muted">(optional)</span></label>
          <input id="email" name="email" type="email" autoComplete="email" className="field" value={values.email} onChange={set("email")} aria-invalid={!!errors.email} aria-describedby={describedBy("email")} />
          <FieldError id="email-error" msg={errors.email} />
        </div>
        <div>
          <label className="field-label" htmlFor="inquiry_type">Inquiry type <span className="text-error" aria-hidden="true">*</span></label>
          <select id="inquiry_type" name="inquiry_type" required className="field" value={values.inquiry_type} onChange={set("inquiry_type")} aria-invalid={!!errors.inquiry_type} aria-describedby={describedBy("inquiry_type")}>
            <option value="">Choose one</option>
            {INQUIRY_TYPES.map((t) => <option key={t}>{t}</option>)}
          </select>
          <FieldError id="inquiry_type-error" msg={errors.inquiry_type} />
        </div>
      </div>
      <div>
        <label className="field-label" htmlFor="message">Message <span className="text-error" aria-hidden="true">*</span></label>
        <textarea id="message" name="message" required className="field" value={values.message} onChange={set("message")} aria-invalid={!!errors.message} aria-describedby={describedBy("message", "message-hint")} />
        <p id="message-hint" className="mt-2 text-[13.5px] text-muted">Helpful to include: rough kitchen size, layout (L, U, straight), and when you&apos;d like to start.</p>
        <FieldError id="message-error" msg={errors.message} />
      </div>

      <div className="flex flex-wrap items-center gap-5 border-t border-[#ece7de] pt-6">
        <button type="submit" className="btn btn-navy min-h-[52px]" disabled={pending} aria-busy={pending}>
          {pending && <SpinnerIcon className="motion-safe:animate-spin" />}
          {pending ? "Sending…" : state.status === "failed" ? "Try Again" : "Send Message"}
        </button>
        <p className="max-w-[380px] text-[13px] text-muted">
          We use your details only to reply to this inquiry. See our <Link href="/privacy-policy" className="underline">Privacy Policy</Link>.
        </p>
      </div>
    </form>
  );
}
