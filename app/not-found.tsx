import Link from "next/link";

export default function NotFound() {
  return (
    <section className="wrap flex min-h-[60vh] flex-col justify-center gap-5 py-24">
      <span aria-hidden="true" className="display text-[clamp(80px,12vw,140px)] leading-none text-gold">404</span>
      <h1 className="display h-xl max-w-[760px]">This page has moved or no longer exists.</h1>
      <p className="max-w-[460px] text-muted">If you followed a link to a project, it may have been renamed. These will get you back on track:</p>
      <div className="flex flex-wrap gap-3">
        <Link href="/" className="btn btn-navy">Go to Home</Link>
        <Link href="/our-works" className="btn btn-outline">Our Works</Link>
        <Link href="/contact" className="btn btn-outline">Contact Us</Link>
      </div>
    </section>
  );
}
