"use client";

import { Reveal, RevealText } from "./motion";

/** Thin gold rule with a diamond in the middle. */
export function Ornament({ className = "" }) {
  return (
    <div className={`flex items-center justify-center gap-3 ${className}`} aria-hidden="true">
      <span className="h-px w-12 bg-gradient-to-r from-transparent to-gold-500/70" />
      <span className="h-1.5 w-1.5 rotate-45 bg-gold-500" />
      <span className="h-px w-12 bg-gradient-to-l from-transparent to-gold-500/70" />
    </div>
  );
}

/** Eyebrow + animated serif headline + optional blurb. */
export function SectionHeading({ eyebrow, title, text, dark = false, align = "center" }) {
  const alignCls = align === "center" ? "text-center mx-auto" : "text-left";
  return (
    <div className={`max-w-3xl space-y-5 ${alignCls}`}>
      {eyebrow && (
        <Reveal>
          <span className={dark ? "eyebrow-dark" : "eyebrow"}>{eyebrow}</span>
        </Reveal>
      )}
      <RevealText
        text={title}
        as="h2"
        className={`font-serif text-4xl sm:text-5xl lg:text-6xl font-normal leading-[1.05] ${
          dark ? "text-cream-100" : "text-forest-950"
        }`}
      />
      {text && (
        <Reveal delay={0.15}>
          <p className={`text-base sm:text-lg leading-relaxed font-normal ${dark ? "text-forest-200" : "text-forest-700"}`}>
            {text}
          </p>
        </Reveal>
      )}
    </div>
  );
}

/** Dark page header used on inner pages (sits under the transparent navbar). */
export function PageHero({ eyebrow, title, text, image }) {
  return (
    <section className="relative grain bg-forest-950 pt-36 pb-20 sm:pt-44 sm:pb-28 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(60%_80%_at_80%_0%,rgba(203,166,39,0.18),transparent_70%)]" />
      <div className="absolute -left-24 top-1/2 h-72 w-72 -translate-y-1/2 rounded-full bg-forest-700/30 blur-3xl" />
      <div className="relative z-10 mx-auto max-w-5xl px-6 text-center space-y-6">
        <Reveal>
          <span className="eyebrow-dark">{eyebrow}</span>
        </Reveal>
        <RevealText
          as="h1"
          immediate
          delay={0.1}
          text={title}
          className="font-serif text-5xl sm:text-6xl lg:text-7xl font-normal text-cream-100 leading-[1.02]"
        />
        <Ornament />
        {text && (
          <Reveal delay={0.3}>
            <p className="mx-auto max-w-2xl text-base sm:text-lg font-normal leading-relaxed text-forest-200">{text}</p>
          </Reveal>
        )}
      </div>
    </section>
  );
}
