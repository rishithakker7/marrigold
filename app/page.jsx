"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { useSite } from "@/components/enquiry-context";
import PolaroidHero from "@/components/PolaroidHero";
import { CountUp, Reveal, Stagger, StaggerItem } from "@/components/motion";
import { Ornament, SectionHeading } from "@/components/ui";
import { BLUR_DATA_URL } from "@/lib/utils";

const Lightbox = dynamic(() => import("@/components/Lightbox"), { ssr: false });

const PROCESS = [
  ["01", "Conversation", "We begin by listening — your families, your traditions, the feeling you want guests to carry home."],
  ["02", "Concept & Design", "Moodboards, themes and layouts built in-house, refined with you until it feels unmistakably yours."],
  ["03", "Curation", "Venues, artists, stationery, hospitality and vendors, coordinated under one roof and one plan."],
  ["04", "Celebration", "Our on-ground team runs every detail so you can simply be present in your own wedding."],
];

export default function HomePage() {
  const { data } = useSite();
  const [lb, setLb] = useState(null);

  const featured = useMemo(() => {
    const all = (data.gallery || []).filter((g) => g.type !== "video");
    const picked = all.filter((g) => g.showOnHome).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    return (picked.length ? picked : all).slice(0, 8);
  }, [data.gallery]);

  const stats = [
    { n: (data.gallery || []).length, s: "", l: "Celebrations in our portfolio" },
    { n: Math.max((data.categories || []).length - 1, 0), s: "", l: "Signature event styles" },
    { n: (data.services || []).length, s: "", l: "Complete service studios" },
  ].filter((x) => x.n > 0);

  const marquee = ["Wedding Planning", "Artisanal Decor", "Destination Weddings", "Mehendi", "Sangeet", "Reception", "Custom Themes"];

  return (
    <>
      <PolaroidHero slides={data.heroSlides} />

      {/* Gold marquee */}
      <div className="overflow-hidden border-y border-gold-500/30 bg-forest-950 py-5" aria-hidden="true">
        <div className="animate-marquee flex w-max gap-12 whitespace-nowrap">
          {[...marquee, ...marquee, ...marquee, ...marquee].map((m, i) => (
            <span key={i} className="flex items-center gap-12 font-serif text-2xl font-medium text-gold-300">
              {m}
              <span className="h-1.5 w-1.5 rotate-45 bg-gold-500" />
            </span>
          ))}
        </div>
      </div>

      {/* Mission */}
      <section className="mx-auto max-w-4xl px-6 py-24 text-center sm:px-8 sm:py-32">
        <SectionHeading
          eyebrow="The Marrigold Way"
          title="Every wedding is a story worth telling beautifully."
        />
        <Reveal delay={0.1}>
          <Ornament className="my-10" />
          <p className="mx-auto max-w-2xl text-lg font-normal leading-relaxed text-forest-700">
            {data.settings?.metaDescription ||
              "From the first conversation to the final farewell, we design, build and run celebrations that feel personal, effortless and unforgettable."}
          </p>
        </Reveal>
      </section>

      {/* Services */}
      <section className="bg-cream-200 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 sm:px-8">
          <SectionHeading eyebrow="What We Do" title="Three studios, one seamless celebration" />
          <Stagger className="mt-20 grid gap-8 md:grid-cols-3" gap={0.14}>
            {(data.services || []).map((sv, i) => (
              <StaggerItem key={sv.id}>
                <Link
                  href={`/services#${sv.id}`}
                  className="group relative block aspect-[3/4] overflow-hidden rounded-3xl bg-forest-900 shadow-lift"
                >
                  <Image
                    src={sv.image}
                    alt={sv.title}
                    fill
                    sizes="(min-width:768px) 33vw, 100vw"
                    quality={75}
                    loading="lazy"
                    placeholder="blur"
                    blurDataURL={BLUR_DATA_URL}
                    className="object-cover transition-transform duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-forest-950 via-forest-950/30 to-transparent" />
                  <div className="absolute inset-3 rounded-2xl border border-gold-300/0 transition-colors duration-500 group-hover:border-gold-300/60" />
                  <div className="absolute inset-x-0 bottom-0 space-y-3 p-7 text-cream-100">
                    <span className="eyebrow-dark">{String(i + 1).padStart(2, "0")}</span>
                    <h3 className="font-serif text-3xl font-normal leading-tight">{sv.title}</h3>
                    <p className="text-sm font-normal leading-relaxed text-cream-200/90">{sv.subtitle}</p>
                    <span className="inline-flex items-center gap-2 pt-1 text-[13px] font-semibold uppercase tracking-[0.14em] text-gold-300">
                      Discover
                      <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1.5" />
                    </span>
                  </div>
                </Link>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* Featured gallery */}
      {featured.length > 0 && (
        <section className="mx-auto max-w-7xl px-6 py-24 sm:px-8 sm:py-32">
          <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
            <SectionHeading align="left" eyebrow="Portfolio" title="Moments we've brought to life" />
            <Reveal>
              <Link href="/gallery" className="link-underline inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-forest-800">
                View full gallery <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Reveal>
          </div>
          <Stagger className="mt-16 columns-2 gap-5 sm:gap-8 lg:columns-3" gap={0.08}>
            {featured.map((g, i) => (
              <StaggerItem key={g.id} className="mb-5 break-inside-avoid sm:mb-8" y={26}>
                <button
                  onClick={() => setLb(i)}
                  className="group relative block w-full overflow-hidden rounded-3xl bg-forest-100 text-left"
                  aria-label={`Open ${g.title}`}
                >
                  <div className={i % 3 === 0 ? "aspect-[4/5]" : i % 3 === 1 ? "aspect-square" : "aspect-[4/3]"}>
                    <Image
                      src={g.url}
                      alt={g.title || "Wedding decor"}
                      fill
                      sizes="(min-width:1024px) 33vw, 50vw"
                      quality={75}
                      loading="lazy"
                      placeholder="blur"
                      blurDataURL={BLUR_DATA_URL}
                      className="object-cover scale-[1.12] transition-transform duration-[1000ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.2]"
                    />
                  </div>
                  <div className="absolute inset-0 flex items-end bg-gradient-to-t from-forest-950/80 via-transparent to-transparent p-5 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                    <span className="font-serif text-xl text-cream-100">{g.title}</span>
                  </div>
                </button>
              </StaggerItem>
            ))}
          </Stagger>
        </section>
      )}
      {lb !== null && <Lightbox items={featured} index={lb} onClose={() => setLb(null)} onIndex={setLb} />}

      {/* Stats from real data */}
      {stats.length > 0 && (
        <section className="grain relative overflow-hidden bg-forest-950 py-20">
          <div className="relative z-10 mx-auto grid max-w-5xl gap-10 px-6 text-center sm:grid-cols-3">
            {stats.map((s) => (
              <Reveal key={s.l}>
                <div className="font-serif text-6xl font-normal gold-gradient-text sm:text-7xl">
                  <CountUp to={s.n} suffix={s.s} />
                </div>
                <p className="mt-3 text-xs uppercase tracking-[0.25em] text-forest-200">{s.l}</p>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* Process */}
      <section className="mx-auto max-w-7xl px-6 py-24 sm:px-8 sm:py-32">
        <SectionHeading eyebrow="How It Unfolds" title="From first hello to the last dance" />
        <Stagger className="mt-16 grid gap-px bg-forest-200 sm:grid-cols-2 lg:grid-cols-4" gap={0.1}>
          {PROCESS.map(([n, t, d]) => (
            <StaggerItem key={n} className="group bg-cream-50 p-8 transition-colors duration-500 hover:bg-forest-950" y={24}>
              <span className="font-serif text-5xl font-normal text-gold-500">{n}</span>
              <h3 className="mt-6 font-serif text-2xl text-forest-950 transition-colors duration-500 group-hover:text-cream-100">{t}</h3>
              <p className="mt-3 text-sm font-normal leading-relaxed text-forest-700 transition-colors duration-500 group-hover:text-forest-200">{d}</p>
            </StaggerItem>
          ))}
        </Stagger>
      </section>
    </>
  );
}
