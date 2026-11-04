"use client";

import Image from "next/image";
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

/** Page header for inner pages: the green artwork, shorter than the home hero, bottom design always visible. */
export function PageHero({ eyebrow, title, text }) {
  return (
    <section className="relative grain flex min-h-[52svh] items-center justify-center overflow-hidden bg-[#154215] pt-28 pb-40 sm:min-h-[60svh] sm:pt-32 sm:pb-44">
      <Image src="/images/new-green-bg.png" alt="" fill priority sizes="100vw" className="object-cover object-bottom" />
      {/* light scrim on the upper part only, so the artwork at the bottom stays untouched */}
      <div className="absolute inset-x-0 top-0 h-2/3 bg-gradient-to-b from-black/35 to-transparent" />
      <div className="relative z-10 mx-auto max-w-5xl space-y-6 px-6 text-center">
        <Reveal>
          <span className="eyebrow-dark">{eyebrow}</span>
        </Reveal>
        <RevealText
          as="h1"
          immediate
          delay={0.1}
          text={title}
          className="font-serif text-5xl sm:text-6xl lg:text-7xl font-normal text-cream-50 leading-[1.02]"
        />
        <Ornament />
        {text && (
          <Reveal delay={0.3}>
            <p className="mx-auto max-w-2xl text-base sm:text-lg font-normal leading-relaxed text-cream-100">{text}</p>
          </Reveal>
        )}
      </div>
    </section>
  );
}
