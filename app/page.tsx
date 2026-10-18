import Image from "next/image";
import Link from "next/link";
import ProjectCard from "@/components/ProjectCard";
import { ArrowUpRight } from "@/components/Icons";
import { getCategories, getFeaturedProjects, getProjects, getSettings, getTestimonials } from "@/lib/content";
import { externalProps, plannerLink, quotationLink } from "@/lib/links";
import { whatsappHref, WA_MESSAGES } from "@/lib/whatsapp";

export const revalidate = 300;

const strengths = [
  { t: "Made to measure", d: "Every unit is sized to your space, so there are no filler gaps or wasted corners." },
  { t: "Finishes you choose", d: "Wood-grain, high-gloss and glass fronts, selected with you to suit the rest of the home." },
  { t: "Manufactured & checked", d: "Cabinets are built in our workshop and checked before they leave for your home." },
  { t: "Planned with you", d: "Layout, storage and quotation are agreed together before anything is made." },
];

const steps = [
  { t: "Discover your requirements", d: "We listen to how you use your kitchen and what needs storing." },
  { t: "Plan your kitchen", d: "Layout, cabinet sizes and appliance positions are worked out." },
  { t: "Review your quotation", d: "You receive a clear quotation to review and adjust." },
  { t: "Confirm materials & design", d: "Finishes, hardware and final drawings are signed off." },
  { t: "Manufacturing & quality checks", d: "Your cabinets are made and checked in our workshop." },
  { t: "Delivery & installation", d: "Delivered and fitted in your home, where offered." },
];

const materials = [
  { src: "/images/gloss-hood-detail.jpg", alt: "Close-up of grey high-gloss cabinet fronts reflecting light", t: "High-gloss fronts", d: "Reflective surfaces that brighten compact kitchens.", pos: "20% 30%" },
  { src: "/images/oak-base-units.jpg", alt: "Close-up of oak wood-grain cabinet finish with a recessed handle", t: "Wood-grain finishes", d: "Warm oak and walnut tones, matched across units.", pos: "50% 75%" },
  { src: "/images/lit-glass-cabinet.jpg", alt: "Lit glass display cabinet with shelves and slim frame", t: "Glass & integrated lighting", d: "Framed glass doors and lit shelves for display.", pos: "50% 50%" },
  { src: "/images/pantry-pullout.jpg", alt: "Pull-out wire baskets inside a tall pantry unit", t: "Interior fittings", d: "Pull-outs and organisers that make every shelf reachable.", pos: "50% 40%" },
];

export default async function HomePage() {
  const [s, featured, all, categories, testimonials] = await Promise.all([
    getSettings(),
    getFeaturedProjects(5),
    getProjects(),
    getCategories(),
    getTestimonials(),
  ]);
  const projects = featured.length ? featured : all.slice(0, 5);
  const planner = plannerLink(s);
  const quote = quotationLink(s);
  const heroImg = projects[0]?.cover ?? { src: "/images/island-grey-oak.jpg", alt: "Pantry LK kitchen" };
  const heroProject = projects[0];
  const layoutClasses = ["md:col-span-7", "md:col-span-5", "md:col-span-4", "md:col-span-4", "md:col-span-4"];
  const ratios = ["4 / 3", "4 / 5.05", "4 / 3", "4 / 3", "4 / 3"];

  return (
    <>
      {/* HERO */}
      <section aria-labelledby="hero-h" className="relative flex min-h-[640px] items-end overflow-hidden bg-navy text-white md:min-h-[800px]">
        <Image src={heroImg.src} alt={heroImg.alt} fill priority sizes="100vw" className="hero-settle object-cover object-[center_55%]" />
        <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(180deg,rgba(14,26,42,0.35)_0%,rgba(14,26,42,0.5)_40%,rgba(14,26,42,0.9)_100%)] md:bg-[linear-gradient(180deg,rgba(14,26,42,0.3)_0%,rgba(14,26,42,0.12)_35%,rgba(14,26,42,0.85)_100%)]" />
        <div className="wrap relative grid items-end gap-10 pb-14 pt-40 md:pb-[72px] [grid-template-columns:repeat(auto-fit,minmax(min(460px,100%),1fr))]">
          <div className="rise">
            <p className="eyebrow mb-5 !text-stone">Custom kitchens &amp; pantries · Sri Lanka</p>
            <h1 id="hero-h" className="display h-hero">
              Beautiful Kitchens. <em>Crafted Around Your Life.</em>
            </h1>
          </div>
          <div className="rise-2 flex max-w-[470px] flex-col gap-7 md:justify-self-end">
            <p className="text-[17px] leading-[1.55] text-[#f1ece3] md:text-[19px]">
              Discover thoughtfully designed kitchen spaces, quality craftsmanship, and custom pantry solutions made for your home.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/our-works" className="btn btn-light">Explore Our Work</Link>
              <a href={quote.href} {...externalProps(quote, s.openAppsInNewTab)} className="btn btn-ghost-light">
                Get a Quotation {quote.external && <ArrowUpRight />}
              </a>
            </div>
          </div>
        </div>
        {heroProject && (
          <Link href={`/our-works/${heroProject.slug}`} className="absolute right-[clamp(16px,4vw,40px)] top-6 hidden text-[13px] text-white/90 hover:text-white md:block">
            Pictured: {heroProject.title} →
          </Link>
        )}
      </section>

      {/* TRUST */}
      <section aria-labelledby="trust-h" className="py-20 md:pb-28 md:pt-32">
        <div className="wrap grid gap-x-20 gap-y-10 [grid-template-columns:repeat(auto-fit,minmax(min(380px,100%),1fr))]">
          <div className="flex flex-col gap-5">
            <p className="eyebrow">Our approach</p>
            <h2 id="trust-h" className="display h-lg">Made for your kitchen, not taken off a shelf.</h2>
          </div>
          <p className="lead self-end">
            Pantry LK designs and manufactures kitchen pantries and cabinetry to fit the room you actually have — your walls, your appliances, and the way your family cooks and stores.
          </p>
        </div>
        <ul className="wrap mt-16 grid gap-10 [grid-template-columns:repeat(auto-fit,minmax(min(250px,100%),1fr))]">
          {strengths.map((x, i) => (
            <li key={x.t} className="flex flex-col gap-2.5 border-t border-navy pt-5">
              <span className="display text-[17px] text-gold-deep">{String(i + 1).padStart(2, "0")}</span>
              <h3 className="text-[19px] font-semibold">{x.t}</h3>
              <p className="text-[15.5px] text-muted">{x.d}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* FEATURED PROJECTS */}
      {projects.length > 0 && (
        <section aria-labelledby="feat-h" className="pb-24 md:pb-32">
          <div className="wrap mb-12 flex flex-wrap items-end justify-between gap-6">
            <div className="flex flex-col gap-4">
              <p className="eyebrow">Our Works</p>
              <h2 id="feat-h" className="display h-lg">Recent kitchens</h2>
            </div>
            <Link href="/our-works" className="tlink">View All Projects <span aria-hidden="true">→</span></Link>
          </div>
          <div className="wrap grid grid-cols-1 gap-7 md:grid-cols-12">
            {projects.map((p, i) => (
              <div key={p.slug} className={layoutClasses[i]}>
                <ProjectCard project={p} ratio={ratios[i]} sizes={i < 2 ? "(max-width: 768px) 100vw, 58vw" : "(max-width: 768px) 100vw, 33vw"} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* PRODUCTS */}
      {categories.length > 0 && (
        <section aria-labelledby="prod-h" className="bg-stone py-24 md:py-30">
          <div className="wrap mb-14 grid items-end gap-x-20 gap-y-8 [grid-template-columns:repeat(auto-fit,minmax(min(380px,100%),1fr))]">
            <div className="flex flex-col gap-4">
              <p className="eyebrow">Products &amp; solutions</p>
              <h2 id="prod-h" className="display h-lg">Every part of the kitchen, built to fit.</h2>
            </div>
            <p className="lead">Start with a single tall pantry or plan a complete kitchen. Each piece is made to your measurements and finish choices.</p>
          </div>
          <div className="wrap grid gap-x-7 gap-y-10 [grid-template-columns:repeat(auto-fit,minmax(min(300px,100%),1fr))]">
            {categories.map((c) => (
              <Link key={c.slug} href={`/products?category=${c.slug}`} className="group flex flex-col gap-3.5">
                {c.image ? (
                  <div className="card-img aspect-[4/5]">
                    <Image src={c.image.src} alt={c.image.alt} fill sizes="(max-width: 700px) 100vw, 33vw" className="object-cover" />
                  </div>
                ) : (
                  <div className="slot aspect-[4/5]">Photo coming soon</div>
                )}
                <h3 className="display h-md underline-offset-4 group-hover:underline">{c.name}</h3>
                <p className="-mt-1.5 text-[15px] text-muted">{c.description}</p>
              </Link>
            ))}
          </div>
          <div className="wrap mt-14">
            <Link href="/products" className="btn btn-navy">Browse All Products</Link>
          </div>
        </section>
      )}

      {/* PROCESS */}
      <section aria-labelledby="proc-h" className="py-24 md:py-32">
        <div className="wrap mb-16 flex flex-col gap-4">
          <p className="eyebrow">Our process</p>
          <h2 id="proc-h" className="display h-lg max-w-[760px]">How your kitchen comes together</h2>
        </div>
        <ol className="wrap grid grid-cols-1 lg:grid-cols-6 lg:gap-6">
          {steps.map((x, i) => (
            <li key={x.t} className="relative border-l border-navy pb-7 pl-6 lg:border-l-0 lg:border-t lg:pb-0 lg:pl-0 lg:pt-5">
              <span aria-hidden="true" className="absolute -left-[5px] top-2 h-[9px] w-[9px] rounded-full bg-navy lg:hidden" />
              <span className="display text-[30px] leading-none text-gold-deep">{i + 1}</span>
              <h3 className="mt-3 text-[17px] font-semibold lg:mt-4">{x.t}</h3>
              <p className="mt-2 text-[15px] text-muted">{x.d}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* KITCHEN PLANNER */}
      <section aria-labelledby="plan-h" className="pb-24 md:pb-32">
        <div className="wrap grid items-center gap-x-24 gap-y-14 [grid-template-columns:repeat(auto-fit,minmax(min(440px,100%),1fr))]">
          <div className="relative aspect-[4/4.6] overflow-hidden bg-stone">
            <Image src="/images/vaulted-l-kitchen-2.jpg" alt="Kitchen with taupe cabinets and under-cabinet lighting beneath a sloping timber ceiling" fill sizes="(max-width: 900px) 100vw, 50vw" className="object-cover" />
          </div>
          <div className="flex max-w-[520px] flex-col gap-6">
            <p className="eyebrow flex items-center gap-2.5">
              Kitchen Planner
              {!planner.available && <span className="bg-navy px-2 py-1 text-[11px] tracking-[0.1em] text-ivory">Coming soon</span>}
            </p>
            <h2 id="plan-h" className="display h-lg">Your Kitchen. Your Vision. Let&apos;s Design It.</h2>
            {planner.available ? (
              <>
                <p className="lead">Arrange cabinets, try layouts and explore finishes in our Kitchen Planner, then share your plan with our team when you&apos;re ready.</p>
                <div className="mt-2 flex flex-wrap items-center gap-5">
                  <a href={planner.href} {...externalProps(planner, s.openAppsInNewTab)} className="btn btn-gold">Open Kitchen Planner <ArrowUpRight /></a>
                  {s.openAppsInNewTab && <span className="text-[14px] text-muted">Opens in a new tab</span>}
                </div>
              </>
            ) : (
              <>
                <p className="lead">
                  Our online Kitchen Planner is on its way — you&apos;ll be able to arrange cabinets, try layouts and explore finishes, then send your plan straight to our team. Until it launches, we&apos;ll plan your kitchen with you.
                </p>
                <div className="mt-2 flex flex-wrap gap-3">
                  <a href={whatsappHref(s.whatsappNumber, WA_MESSAGES.planning)} target="_blank" rel="noopener noreferrer" className="btn btn-gold">Plan With Our Team</a>
                  <a href={quote.href} {...externalProps(quote, s.openAppsInNewTab)} className="btn btn-outline">Get a Quotation {quote.external && <ArrowUpRight />}</a>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* QUOTATION MAKER */}
      <section aria-labelledby="quote-h" className="bg-navy text-ivory">
        <div className="grid [grid-template-columns:repeat(auto-fit,minmax(min(520px,100%),1fr))]">
          <div className="flex max-w-[720px] flex-col justify-center gap-6 px-[clamp(16px,6vw,96px)] py-[clamp(64px,8vw,120px)]">
            <p className="eyebrow !text-gold-light">Quotation Maker</p>
            <h2 id="quote-h" className="display h-lg">Planning Your New Kitchen? Start With a Quote.</h2>
            <p className="text-[18px] leading-relaxed text-[#d9d4ca]">
              Enter your layout, approximate sizes and preferred finishes. The Quotation Maker turns them into a quotation that our team reviews and confirms with you. Final prices depend on your measurements and selections.
            </p>
            <div className="mt-2 flex flex-wrap gap-3">
              <a href={quote.href} {...externalProps(quote, s.openAppsInNewTab)} className="btn btn-gold">
                Create Your Quotation {quote.external && <ArrowUpRight />}
              </a>
              <Link href="/contact" className="btn btn-ghost-light">Talk to Our Team</Link>
            </div>
          </div>
          <div className="relative min-h-[420px] md:min-h-[520px]">
            <Image src="/images/gloss-hood-detail.jpg" alt="Grey high-gloss wall cabinets with a black angled hood and linear lighting above a stone worktop" fill sizes="(max-width: 1040px) 100vw, 50vw" className="object-cover" />
          </div>
        </div>
      </section>

      {/* MATERIALS */}
      <section aria-labelledby="mat-h" className="py-24 md:py-32">
        <div className="wrap mb-14 grid items-end gap-x-20 gap-y-8 [grid-template-columns:repeat(auto-fit,minmax(min(420px,100%),1fr))]">
          <div className="flex flex-col gap-4">
            <p className="eyebrow">Materials &amp; craftsmanship</p>
            <h2 id="mat-h" className="display h-lg">Look closer. The details carry the kitchen.</h2>
          </div>
          <p className="lead">Fronts, glass, lighting and interior fittings are chosen together, so the finished kitchen feels considered from across the room and up close.</p>
        </div>
        <div className="wrap grid gap-7 [grid-template-columns:repeat(auto-fit,minmax(min(260px,100%),1fr))]">
          {materials.map((m) => (
            <figure key={m.t} className="flex flex-col gap-3.5">
              <div className="relative aspect-square overflow-hidden">
                <Image src={m.src} alt={m.alt} fill sizes="(max-width: 600px) 100vw, 25vw" className="scale-[1.35] object-cover" style={{ objectPosition: m.pos }} />
              </div>
              <figcaption>
                <strong className="block font-semibold">{m.t}</strong>
                <span className="text-[15px] text-muted">{m.d}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* TESTIMONIALS — only approved reviews; section hidden when none */}
      {testimonials.length > 0 && (
        <section aria-labelledby="test-h" className="bg-stone py-24">
          <div className="wrap flex flex-col gap-12">
            <p id="test-h" className="eyebrow">From our customers</p>
            <div className="grid gap-12 [grid-template-columns:repeat(auto-fit,minmax(min(360px,100%),1fr))]">
              {testimonials.slice(0, 3).map((t) => (
                <figure key={t.id} className="flex flex-col gap-5 border-t border-navy pt-6">
                  <blockquote className="display text-[24px] leading-snug">“{t.quote}”</blockquote>
                  <figcaption className="text-[15px]">
                    <strong className="font-semibold">{t.name}</strong>
                    {t.area && <span className="text-muted"> · {t.area}</span>}
                    {t.projectSlug && (
                      <>
                        {" "}· <Link href={`/our-works/${t.projectSlug}`} className="underline">View their kitchen</Link>
                      </>
                    )}
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FINAL CTA */}
      <section aria-labelledby="cta-h" className="relative flex min-h-[560px] items-center overflow-hidden bg-navy text-white md:min-h-[640px]">
        <Image src="/images/island-grey-oak-2.jpg" alt="" fill sizes="100vw" className="object-cover" />
        <div aria-hidden="true" className="absolute inset-0 bg-[rgba(14,26,42,0.66)]" />
        <div className="wrap relative flex flex-col items-start gap-8">
          <h2 id="cta-h" className="display h-xl max-w-[900px]">Let&apos;s Create a Kitchen You&apos;ll Love Coming Home To.</h2>
          <div className="flex flex-wrap gap-3">
            <Link href="/our-works" className="btn btn-light">Explore Our Work</Link>
            <Link href="/contact" className="btn btn-ghost-light">Contact Our Team</Link>
          </div>
        </div>
      </section>
    </>
  );
}
