"use client";

import Link from "next/link";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <section className="wrap flex min-h-[60vh] flex-col justify-center gap-5 py-24">
      <h1 className="display h-xl max-w-[760px]">Something went wrong on our side.</h1>
      <p className="max-w-[460px] text-muted">The page didn&apos;t load properly. Please try again in a moment — if it keeps happening, call or WhatsApp us and we&apos;ll help directly.</p>
      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={reset} className="btn btn-navy">Try Again</button>
        <Link href="/" className="btn btn-outline">Go to Home</Link>
        <Link href="/contact" className="btn btn-outline">Contact Us</Link>
      </div>
    </section>
  );
}
