"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { EASE, Magnetic } from "./motion";

const DURATION = 7000;

export default function HeroSlider({ slides = [] }) {
  const reduce = useReducedMotion();
  const [i, setI] = useState(0);
  const ref = useRef(null);
  const touch = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", reduce ? "0%" : "18%"]);
  const fade = useTransform(scrollYProgress, [0, 0.8], [1, reduce ? 1 : 0]);

  const count = slides.length;
  const go = useCallback((dir) => setI((n) => (n + dir + count) % count), [count]);

  useEffect(() => {
    if (count < 2 || reduce) return;
    const t = setTimeout(() => setI((n) => (n + 1) % count), DURATION);
    return () => clearTimeout(t);
  }, [i, count, reduce]);

  if (!count) return null;
  const s = slides[i % count];
  const pad = (n) => String(n).padStart(2, "0");

  return (
    <section
      ref={ref}
      className="grain relative h-[100svh] min-h-[620px] w-full overflow-hidden bg-forest-950"
      onTouchStart={(e) => (touch.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touch.current == null) return;
        const dx = e.changedTouches[0].clientX - touch.current;
        if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
        touch.current = null;
      }}
    >
      <motion.div style={{ y }} className="absolute inset-0">
        <AnimatePresence initial={false}>
          <motion.div
            key={s.id}
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.4, ease: "easeOut" }}
          >
            <motion.div
              className="absolute inset-0"
              initial={{ scale: reduce ? 1 : 1.0 }}
              animate={{ scale: reduce ? 1 : 1.12 }}
              transition={{ duration: (DURATION + 1400) / 1000, ease: "linear" }}
            >
              <Image src={s.image} alt={s.title || ""} fill priority={i === 0} sizes="100vw" className="object-cover" />
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* Darker scrim on the text side so headlines stay readable on busy photos */}
      <div className="absolute inset-0 z-[2] bg-gradient-to-t from-forest-950 via-forest-950/40 to-forest-950/60" />
      <div className="absolute inset-0 z-[2] bg-gradient-to-r from-forest-950/75 via-forest-950/25 to-transparent" />

      <motion.div style={{ opacity: fade }} className="relative z-10 mx-auto flex h-full max-w-7xl flex-col justify-end px-6 pb-32 sm:px-8 sm:pb-36">
        <AnimatePresence mode="wait">
          <motion.div
            key={s.id}
            className="max-w-3xl space-y-6"
            initial="hidden"
            animate="show"
            exit={{ opacity: 0, transition: { duration: 0.25 } }}
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.12, delayChildren: 0.25 } } }}
          >
            <motion.span
              className="eyebrow-dark hero-text block"
              variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: EASE } } }}
            >
              Marrigold Events · Mumbai
            </motion.span>
            <h1 className="hero-text font-serif text-5xl font-medium leading-[1.05] tracking-tight text-cream-50 sm:text-6xl lg:text-7xl">
              {String(s.title).split(" ").map((w, k) => (
                <span key={k} className="inline-block overflow-hidden pb-[0.14em] -mb-[0.14em] align-bottom">
                  <motion.span
                    className="inline-block"
                    variants={{ hidden: { y: "110%" }, show: { y: "0%", transition: { duration: 1.1, ease: EASE } } }}
                  >
                    {w}&nbsp;
                  </motion.span>
                </span>
              ))}
            </h1>
            <motion.p
              className="hero-text max-w-xl text-lg font-medium leading-relaxed text-cream-50 sm:text-xl"
              variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.9, ease: EASE } } }}
            >
              {s.subtitle}
            </motion.p>
            {s.ctaText && (
              <motion.div
                variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.9, ease: EASE } } }}
              >
                <Magnetic>
                  <Link href={s.ctaLink || "/gallery"} className="btn-gold">
                    {s.ctaText}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Magnetic>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {count > 1 && (
        <>
          {/* Progress lines (click to jump) */}
          <div className="absolute inset-x-0 bottom-8 z-10 mx-auto flex max-w-7xl items-center gap-3 px-6 pr-36 sm:px-8 sm:pr-8">
            {slides.map((sl, k) => (
              <button key={sl.id} onClick={() => setI(k)} aria-label={`Go to slide ${k + 1}`} className="group relative h-8 max-w-[88px] flex-1">
                <span className="absolute inset-x-0 top-1/2 h-0.5 bg-cream-50/30 transition-colors group-hover:bg-cream-50/60" />
                {k === i && !reduce && <span key={`${i}-p`} className="animate-fill absolute inset-x-0 top-1/2 h-0.5 bg-gold-400" style={{ animationDuration: `${DURATION}ms` }} />}
                {k === i && reduce && <span className="absolute inset-x-0 top-1/2 h-0.5 bg-gold-400" />}
              </button>
            ))}
          </div>

          {/* Prev / next */}
          <div className="absolute bottom-6 right-5 z-20 flex items-center gap-4 sm:bottom-7 sm:right-8">
            <span className="hero-text hidden font-serif text-lg font-medium tabular-nums text-cream-50 sm:block">
              {pad(i + 1)}
              <span className="mx-1.5 text-cream-50/50">/</span>
              <span className="text-cream-50/70">{pad(count)}</span>
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => go(-1)}
                aria-label="Previous slide"
                className="flex h-12 w-12 items-center justify-center rounded-full border border-cream-50/50 bg-forest-950/40 text-cream-50 backdrop-blur-sm transition-all duration-300 hover:border-gold-400 hover:bg-gold-400 hover:text-forest-950 active:scale-90"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={() => go(1)}
                aria-label="Next slide"
                className="flex h-12 w-12 items-center justify-center rounded-full border border-cream-50/50 bg-forest-950/40 text-cream-50 backdrop-blur-sm transition-all duration-300 hover:border-gold-400 hover:bg-gold-400 hover:text-forest-950 active:scale-90"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
