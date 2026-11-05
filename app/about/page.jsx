"use client";

import { useRef } from "react";
import Image from "next/image";
import {
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useSite } from "@/components/enquiry-context";
import { CountUp, EASE, Magnetic, Reveal, RevealText, Stagger, StaggerItem } from "@/components/motion";
import { Ornament, PageHero, SectionHeading } from "@/components/ui";

/* ------------------------------------------------------------------ */
/* Content (from the Femina feature on Parul Daftary)                   */
/* ------------------------------------------------------------------ */
const JOURNEY = [
  ["The Florist", "It started with flowers. Parul completed a five-year instructor's course at the Ohara School of Ikebana, the Japanese art of floral arrangement."],
  ["In-House Florist", "She began her career as an in-house florist at five-star hotels, where freshness and precision are the whole job."],
  ["Décor Panellist", "Later she joined those hotels as a décor panellist, curating celebrations that bring together elegance, tradition and innovation."],
  ["Marrigold Events", "Floral arrangements grew into large-scale décor and full wedding planning, each project shaped by Parul's hallmark precision and artistry."],
];

const VALUES = [
  ["Detail", "Every stem, seam and sightline is considered."],
  ["Freshness", "Ideas, flowers and finishes that feel alive on the day."],
  ["Balance", "Grand or intimate, nothing is ever too much."],
];

const FACTS = [
  { n: 25, s: "", l: "Years of Marrigold" },
  { n: 5, s: "", l: "Year Ikebana instructor course, Ohara School" },
  { n: 5, s: "★", l: "Hotels she has collaborated with" },
];

const QUOTE =
  "Flowers taught me detail, freshness, and balance. For me, décor is not just about design, it's about weaving memories that last forever.";

const MARQUEE = ["Detail", "Freshness", "Balance", "Florals", "Ikebana", "Décor", "Weddings", "Stories"];

/* ------------------------------------------------------------------ */
/* Small motion helpers (all transform / opacity only)                  */
/* ------------------------------------------------------------------ */

/** Leans toward the cursor in 3D. Mouse only, off for reduced motion. */
function Tilt({ children, className = "", max = 6 }) {
  const reduce = useReducedMotion();
  const ref = useRef(null);
  const rx = useSpring(useMotionValue(0), { stiffness: 180, damping: 18 });
  const ry = useSpring(useMotionValue(0), { stiffness: 180, damping: 18 });

  const onMove = (e) => {
    if (reduce || e.pointerType !== "mouse" || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    ry.set(((e.clientX - r.left) / r.width - 0.5) * 2 * max);
    rx.set(-((e.clientY - r.top) / r.height - 0.5) * 2 * max);
  };
  const reset = () => {
    rx.set(0);
    ry.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={reset}
      style={{ rotateX: rx, rotateY: ry, transformPerspective: 1000 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/** A soft gold light that follows the cursor inside a card (moves via transform, not repaint). */
function Spotlight({ children, className = "" }) {
  const reduce = useReducedMotion();
  const ref = useRef(null);
  const x = useMotionValue(-400);
  const y = useMotionValue(-400);
  const sx = useSpring(x, { stiffness: 260, damping: 30 });
  const sy = useSpring(y, { stiffness: 260, damping: 30 });

  const onMove = (e) => {
    if (reduce || e.pointerType !== "mouse" || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    x.set(e.clientX - r.left - 160);
    y.set(e.clientY - r.top - 160);
  };

  return (
    <div ref={ref} onPointerMove={onMove} className={`group relative overflow-hidden ${className}`}>
      <motion.span
        aria-hidden="true"
        style={{ x: sx, y: sy }}
        className="pointer-events-none absolute left-0 top-0 h-80 w-80 rounded-full bg-[radial-gradient(circle,rgba(220,190,82,0.38),transparent_65%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100"
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

/** One word that brightens as the section scrolls past. */
function Word({ children, progress, range, reduce }) {
  const opacity = useTransform(progress, range, [0.18, 1]);
  return (
    <motion.span style={reduce ? undefined : { opacity }} className="inline-block">
      {children}&nbsp;
    </motion.span>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                 */
/* ------------------------------------------------------------------ */
export default function AboutPage() {
  const { data, openEnquiry } = useSite();
  const reduce = useReducedMotion();
  const insta = data.contact?.socials?.instagram;

  // founder photo parallax
  const photoRef = useRef(null);
  const { scrollYProgress: photoP } = useScroll({ target: photoRef, offset: ["start end", "end start"] });
  const photoIn = useInView(photoRef, { once: true, amount: 0.2 });
  const photoY = useTransform(photoP, [0, 1], reduce ? ["0%", "0%"] : ["-7%", "7%"]);

  // timeline line draws as you scroll
  const tlRef = useRef(null);
  const { scrollYProgress: tlP } = useScroll({ target: tlRef, offset: ["start 75%", "end 60%"] });
  const lineScale = useSpring(tlP, { stiffness: 120, damping: 28, mass: 0.4 });

  // quote section: parallax background + word-by-word reveal
  const quoteRef = useRef(null);
  const { scrollYProgress: qBg } = useScroll({ target: quoteRef, offset: ["start end", "end start"] });
  const bgY = useTransform(qBg, [0, 1], reduce ? ["0%", "0%"] : ["-10%", "10%"]);
  const { scrollYProgress: qWords } = useScroll({ target: quoteRef, offset: ["start 75%", "center 45%"] });
  const words = QUOTE.split(" ");

  return (
    <>
      <PageHero
        eyebrow="Our Story"
        title="About Marrigold"
        text="Twenty-five years of turning flowers, detail and heart into celebrations that last."
      />
      {/* Quick facts, overlapping the hero */}
      <section className="relative z-20 mx-auto mt-16 max-w-5xl px-6 sm:px-8">
        <Stagger className="grid gap-4 sm:grid-cols-3" gap={0.12}>
          {FACTS.map((f) => (
            <StaggerItem key={f.l} y={26}>
              <div className="group h-full border border-forest-200 bg-cream-50 px-6 py-7 text-center shadow-lift transition-[transform,border-color,box-shadow] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1.5 hover:border-gold-500/70 hover:shadow-gold">
                <div className="font-serif text-5xl font-medium leading-none gold-gradient-text transition-transform duration-500 group-hover:scale-110">
                  <CountUp to={f.n} suffix={f.s} />
                </div>
                <p className="mx-auto mt-3 max-w-[16rem] text-xs font-semibold uppercase leading-relaxed tracking-[0.18em] text-forest-700">{f.l}</p>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      {/* Founder story */}
      <section className="mx-auto max-w-7xl px-6 py-24 sm:px-8 sm:py-32">
        <div className="grid items-start gap-14 lg:grid-cols-12 lg:gap-20">
          <div className="lg:sticky lg:top-28 lg:col-span-5">
            <Tilt className="relative mx-auto max-w-sm lg:max-w-none" max={5}>
              {/* the photo wipes open, then drifts gently while you scroll */}
              <div ref={photoRef} className="relative">
                <motion.div
                  className="relative aspect-[3/4] overflow-hidden bg-forest-900 shadow-lift"
                  initial={reduce ? false : { clipPath: "inset(100% 0 0 0)" }}
                  animate={reduce || photoIn ? { clipPath: "inset(0% 0 0 0)" } : { clipPath: "inset(100% 0 0 0)" }}
                  transition={{ duration: 1.2, ease: EASE }}
                >
                  <motion.div style={{ y: photoY }} className="absolute -inset-y-[9%] inset-x-0">
                    <Image
                      src="/images/founder-parul.jpg"
                      alt="Parul Daftary, Founder and Director of Marrigold Events"
                      fill
                      priority
                      sizes="(min-width:1024px) 40vw, 90vw"
                      className="object-cover"
                    />
                  </motion.div>
                </motion.div>
              </div>
              <motion.div
                aria-hidden="true"
                className="absolute -bottom-4 -right-4 -z-10 h-full w-full border border-gold-500/60"
                initial={reduce ? false : { opacity: 0, x: -18, y: -18 }}
                whileInView={{ opacity: 1, x: 0, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.9, delay: 0.6, ease: EASE }}
              />
            </Tilt>
            <Reveal delay={0.3}>
              <div className="mt-9 text-center lg:text-left">
                <div className="font-serif text-3xl font-medium text-forest-950">Parul Daftary</div>
                <div className="mt-1 text-xs font-semibold uppercase tracking-[0.2em] text-gold-700">Founder &amp; Director</div>
              </div>
            </Reveal>
          </div>

          <div className="space-y-8 lg:col-span-7">
            <Reveal>
              <span className="eyebrow">From Florist to Wedding Visionary</span>
            </Reveal>
            <RevealText
              as="h2"
              text="Behind every great celebration is a story of passion."
              className="font-serif text-4xl font-medium leading-[1.05] text-forest-950 sm:text-5xl lg:text-6xl"
            />
            <Reveal delay={0.1}>
              <div className="space-y-5 text-lg leading-relaxed text-forest-800">
                <p>
                  For Parul Daftary, that story began with flowers. Her deep love for floral artistry became the foundation of what
                  is now one of Mumbai&apos;s most admired décor and wedding planning companies.
                </p>
                <p>
                  Today, Marrigold Events celebrates 25 years built on creativity, trust and timeless design. Whether it is a grand
                  wedding or an intimate gathering, the touch has always been the same: décor that tells a story.
                </p>
              </div>
            </Reveal>

            {/* Timeline: a gold line draws down as you scroll */}
            <div ref={tlRef} className="relative pt-4">
              <span className="absolute bottom-4 left-[15px] top-8 w-px bg-forest-200" aria-hidden="true" />
              <motion.span
                aria-hidden="true"
                style={{ scaleY: reduce ? 1 : lineScale, transformOrigin: "top" }}
                className="absolute bottom-4 left-[15px] top-8 w-px bg-gradient-to-b from-gold-400 to-gold-600"
              />
              <Stagger className="space-y-2" gap={0.12}>
                {JOURNEY.map(([t, d], i) => (
                  <StaggerItem key={t} y={22}>
                    <div className="group relative -mx-3 flex gap-6 rounded-sm px-3 py-5 transition-colors duration-500 hover:bg-cream-200">
                      <span className="relative z-10 mt-1.5 flex h-[31px] w-[31px] shrink-0 items-center justify-center rounded-full border border-gold-500 bg-cream-50 transition-[transform,background-color] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-110 group-hover:bg-gold-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-gold-600 transition-colors duration-300 group-hover:bg-forest-950" />
                      </span>
                      <div className="transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-1.5">
                        <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold-700">
                          Chapter {String(i + 1).padStart(2, "0")}
                        </span>
                        <h3 className="mt-1 font-serif text-2xl font-medium text-forest-950">{t}</h3>
                        <p className="mt-1.5 text-base leading-relaxed text-forest-800">{d}</p>
                      </div>
                    </div>
                  </StaggerItem>
                ))}
              </Stagger>
            </div>
          </div>
        </div>
      </section>

      {/* Gold marquee */}
      <div className="overflow-hidden border-y border-gold-500/30 bg-forest-950 py-5" aria-hidden="true">
        <div className="animate-marquee flex w-max gap-12 whitespace-nowrap">
          {[...MARQUEE, ...MARQUEE, ...MARQUEE].map((m, i) => (
            <span key={i} className="flex items-center gap-12 font-serif text-2xl font-medium italic text-gold-300">
              {m}
              <span className="h-1.5 w-1.5 rotate-45 bg-gold-500" />
            </span>
          ))}
        </div>
      </div>

      {/* Quote: parallax photo, words light up as you scroll */}
      <section ref={quoteRef} className="grain relative overflow-hidden bg-forest-950 py-32 sm:py-44">
        <motion.div style={{ y: bgY }} className="absolute inset-x-0 -inset-y-[12%]">
          <Image
            src="/images/new-green-bg-wo-design.png"
            alt=""
            fill
            sizes="100vw"
            className="object-cover object-center opacity-70"
          />
        </motion.div>
        <div className="absolute inset-0 bg-gradient-to-b from-forest-950/75 via-forest-950/35 to-forest-950/75" />
        <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
          <Reveal>
            <span className="eyebrow-dark">In Her Words</span>
          </Reveal>
          <p className="mt-8 font-serif text-3xl font-medium italic leading-snug text-cream-50 sm:text-5xl" aria-label={QUOTE}>
            <span aria-hidden="true">&ldquo;</span>
            {words.map((w, i) => {
              const a = i / words.length;
              const b = Math.min(1, a + 1.5 / words.length);
              return (
                <Word key={`${w}-${i}`} progress={qWords} range={[a, b]} reduce={reduce}>
                  {w}
                </Word>
              );
            })}
            <span aria-hidden="true">&rdquo;</span>
          </p>
          <Reveal delay={0.1}>
            <Ornament className="my-8" />
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold-300">Parul Daftary</p>
          </Reveal>
        </div>
      </section>

      {/* Values with a cursor-following gold light */}
      <section className="mx-auto max-w-7xl px-6 py-24 sm:px-8 sm:py-32">
        <SectionHeading eyebrow="What Flowers Taught Us" title="Three values behind every project" />
        <Stagger className="mt-16 grid gap-5 sm:grid-cols-3" gap={0.14}>
          {VALUES.map(([t, d], i) => (
            <StaggerItem key={t} y={30}>
              <Spotlight className="h-full border border-forest-200 bg-cream-50 transition-[transform,border-color,background-color,box-shadow] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-2 hover:border-gold-500/70 hover:bg-forest-950 hover:shadow-lift">
                <div className="p-10 text-center">
                  <span className="font-serif text-sm font-medium tracking-[0.3em] text-gold-600">{String(i + 1).padStart(2, "0")}</span>
                  <h3 className="mt-3 font-serif text-4xl font-medium text-forest-950 transition-colors duration-500 group-hover:text-gold-300">{t}</h3>
                  <span className="mx-auto mt-5 block h-px w-10 bg-gold-500 transition-[width] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:w-24" />
                  <p className="mt-5 text-base leading-relaxed text-forest-800 transition-colors duration-500 group-hover:text-forest-200">{d}</p>
                </div>
              </Spotlight>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      {/* Looking ahead + CTA */}
      <section className="mx-auto max-w-7xl px-6 pb-24 sm:px-8 sm:pb-32">
        <Reveal>
          <div className="relative overflow-hidden bg-[#154215] px-8 pb-32 pt-16 text-center sm:px-16 sm:pb-40 sm:pt-24">
            <Image src="/images/new-green-bg.png" alt="" fill sizes="(min-width:1280px) 1200px, 100vw" className="object-cover object-bottom" />
            <div className="absolute inset-x-0 top-0 h-3/4 bg-gradient-to-b from-forest-950/50 to-transparent" />
            <div className="absolute inset-0 bg-[radial-gradient(60%_90%_at_50%_0%,rgba(203,166,39,0.18),transparent_70%)]" />
            {/* slow drifting glows */}
            <motion.span
              aria-hidden="true"
              className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-gold-500/15 blur-3xl"
              animate={reduce ? undefined : { x: [0, 60, 0], y: [0, 30, 0] }}
              transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.span
              aria-hidden="true"
              className="absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-forest-500/25 blur-3xl"
              animate={reduce ? undefined : { x: [0, -50, 0], y: [0, -30, 0] }}
              transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
            />
            <div className="relative z-10 space-y-7">
              <span className="eyebrow-dark">Looking Ahead</span>
              <RevealText
                as="h2"
                text="The weddings and events of tomorrow"
                className="mx-auto max-w-3xl font-serif text-4xl font-medium leading-tight text-cream-100 sm:text-6xl"
              />
              <Reveal delay={0.15}>
                <p className="mx-auto max-w-xl text-base leading-relaxed text-forest-200">
                  Marrigold is embracing modern trends and sustainable practices, while continuing its legacy of personalised,
                  unforgettable celebrations.
                </p>
              </Reveal>
              <Reveal delay={0.25}>
                <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                  <Magnetic>
                    <button onClick={() => openEnquiry()} className="btn-gold">
                      Enquire Now
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </Magnetic>
                  {insta && (
                    <Magnetic>
                      <a href={insta} target="_blank" rel="noopener noreferrer" className="btn-ghost">
                        <img src="/images/icons/instagram.svg" alt="" className="h-4 w-4 object-contain" aria-hidden="true" />
                        @marrigoldevents
                      </a>
                    </Magnetic>
                  )}
                </div>
              </Reveal>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}
