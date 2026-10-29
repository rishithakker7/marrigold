"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, ChevronLeft, ChevronRight, X } from "lucide-react";
import { EASE } from "./motion";

/*
 * Polaroid line hero: prints pegged to a sagging gold string. Drag the line,
 * use the arrows / keyboard, or let it autoplay. The print in the middle is
 * the active slide; its title, subtitle and button sit around it.
 * Slides come from data.heroSlides: { id, image, title, subtitle, ctaText, ctaLink }.
 */

// ---------- physics helpers ----------
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

/** Height of a string sagging by `sag` between (0, y0) and (w, y0), at x. */
const stringY = (x, w, y0, sag) => {
  const t = clamp(x / w, 0, 1);
  return y0 + 4 * sag * t * (1 - t);
};

/** One step of a critically damped spring toward target. */
const springStep = (x, v, target, dt, k = 70) => {
  const c = 2 * Math.sqrt(k);
  const nv = v + (k * (target - x) - c * v) * dt;
  return [x + nv * dt, nv];
};

/** One step of a print's swing (lags the motion, pulled back by gravity, damped). */
const swingStep = (a, w, lineVel, dt, gain) => {
  const nw = w + (-38 * a - 4.2 * w + lineVel * 0.0034 * gain) * dt;
  return [clamp(a + nw * dt, -0.6, 0.6), nw];
};

const nearestAt = (off, spacing, n) => clamp(Math.round(off / spacing), 0, Math.max(0, n - 1));
const pad2 = (n) => (n < 10 ? "0" + n : String(n));

const PL_CSS = [
  ".pl-root{position:relative;width:100%;overflow:hidden;user-select:none;-webkit-user-select:none;touch-action:pan-y;outline:none;cursor:grab}",
  ".pl-root[data-drag='1']{cursor:grabbing}",
  ".pl-card{cursor:zoom-in}",
  ".pl-root[data-drag='1'] .pl-card{cursor:grabbing}",
  ".pl-root:focus-visible{box-shadow:inset 0 0 0 2px #dcbe52}",
  ".pl-string{position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none;overflow:visible}",
  ".pl-card{position:absolute;left:0;top:0;width:var(--pl-cw);transform-origin:50% 0;will-change:transform}",
  ".pl-print{margin-top:10px;background:#fbfaf7;padding:10px 10px 0;box-shadow:0 1px 2px rgba(0,0,0,.3),0 28px 40px -18px rgba(0,0,0,.75);transition:transform .5s cubic-bezier(.2,.7,.2,1),filter .5s ease}",
  ".pl-card[data-on='0'] .pl-print{transform:scale(.9);filter:saturate(.7) brightness(.75)}",
  ".pl-shot{position:relative;aspect-ratio:1;overflow:hidden;background:#1c3b2b}",
  ".pl-shot img{position:absolute;inset:0;width:100%;height:100%;max-width:none;object-fit:cover;display:block;pointer-events:none}",
  ".pl-note{height:46px;display:flex;align-items:center;justify-content:center;padding:0 6px;font-family:var(--font-display),Georgia,serif;font-style:italic;font-size:16px;color:#3b3833;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
  ".pl-peg{position:absolute;left:50%;top:0;width:10px;height:26px;margin-left:-5px;border-radius:2px;background:linear-gradient(90deg,#b8891f,#e8d385 45%,#a67a14);box-shadow:0 2px 3px rgba(0,0,0,.4)}",
  ".pl-peg::after{content:'';position:absolute;left:4px;top:8px;width:2px;height:7px;background:rgba(60,40,5,.5);border-radius:1px}",
].join("\n");

const BAR_H = 112; // room kept free at the bottom for the button + arrows

export default function PolaroidHero({ slides = [], cardWidth = 300, sag = 46, swing = 1, autoplay = 6000 }) {
  const n = slides.length;
  const reduceMotion = useReducedMotion();
  const [active, setActive] = React.useState(0);
  const [dragging, setDragging] = React.useState(false);
  const [lb, setLb] = React.useState(null);
  const lbRef = React.useRef(null);
  lbRef.current = lb;
  const [size, setSize] = React.useState({ w: 1200, h: 800, cw: cardWidth, top: 300, sag, narrow: false });

  const rootRef = React.useRef(null);
  const pathRef = React.useRef(null);
  const cards = React.useRef([]);
  const sim = React.useRef({ off: 0, vel: 0, target: 0, a: [], w: [] });
  const drag = React.useRef(null);
  const lastTouch = React.useRef(0);
  const activeRef = React.useRef(0);
  const opts = React.useRef({ swing });
  opts.current = { swing };

  const spacing = size.cw * 1.08;
  const goTo = React.useCallback(
    (i) => {
      sim.current.target = clamp(i, 0, n - 1) * spacing;
    },
    [n, spacing]
  );

  // Layout: heading zone on top, string below it, prints sized to fit above the button bar.
  React.useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const ro = new ResizeObserver(() => {
      const r = root.getBoundingClientRect();
      const narrow = r.width < 640;
      const sg = narrow ? sag * 0.65 : sag;
      const baseTop = narrow ? Math.min(r.height * 0.42, 330) : Math.min(Math.max(r.height * 0.38, 270), 360);
      const fit = r.height - baseTop - sg - 158; // print height = cw + ~56
      // phones and tablets get a larger print so the scene fills the screen
      const cap = r.width < 1024 ? cardWidth * 1.3 : cardWidth;
      const cw = Math.round(Math.max(140, Math.min(cap, r.width * (narrow ? 0.66 : 0.46), fit)));
      // split any leftover height evenly above and below the print so the button never floats far away
      const leftover = r.height - baseTop - sg - (cw + 56) - BAR_H;
      const top = baseTop + Math.max(0, Math.min(leftover * 0.5, 140));
      setSize({ w: r.width, h: r.height, cw, top, sag: sg, narrow });
    });
    ro.observe(root);
    return () => ro.disconnect();
  }, [cardWidth, sag]);

  // keep the active print centred when the spacing changes
  React.useEffect(() => {
    sim.current.target = activeRef.current * spacing;
    sim.current.off = activeRef.current * spacing;
  }, [spacing]);

  // the simulation, written straight to the DOM each frame
  React.useEffect(() => {
    const root = rootRef.current;
    if (!root || !n) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let visible = true;
    let raf = 0;
    let prev = performance.now();
    const S = sim.current;

    const frame = (now) => {
      raf = 0;
      if (!visible) return;
      const dt = Math.min(0.033, (now - prev) / 1000);
      prev = now;
      const { w, cw, top: y0, sag: sg } = size;
      const d = drag.current;
      let lineVel;
      if (d && d.moved) {
        lineVel = d.v * 1000;
      } else {
        const before = S.off;
        [S.off, S.vel] = springStep(S.off, S.vel, S.target, dt);
        lineVel = -(S.off - before) / Math.max(dt, 1e-3);
      }
      const g = reduce ? 0 : opts.current.swing;
      const near = nearestAt(S.off, spacing, n);
      for (let i = 0; i < n; i++) {
        const el = cards.current[i];
        if (!el) continue;
        const x = w / 2 + i * spacing - S.off;
        if (x < -cw * 1.5 || x > w + cw * 1.5) {
          el.style.visibility = "hidden";
          continue;
        }
        el.style.visibility = "visible";
        let a = S.a[i] || 0;
        let av = S.w[i] || 0;
        [a, av] = swingStep(a, av, lineVel, dt, g);
        if (g) a += Math.sin(now / 1300 + i * 1.7) * 0.0009 * g;
        S.a[i] = a;
        S.w[i] = av;
        const y = stringY(x, w, y0, sg) - 6;
        el.style.transform = "translate(" + (x - cw / 2).toFixed(1) + "px," + y.toFixed(1) + "px) rotate(" + a.toFixed(4) + "rad)";
        el.style.zIndex = String(i === near ? n + 1 : n - Math.abs(i - near));
      }
      pathRef.current?.setAttribute("d", "M0 " + y0 + " Q" + w / 2 + " " + (y0 + 2 * sg) + " " + w + " " + y0);
      if (near !== activeRef.current) {
        activeRef.current = near;
        setActive(near);
      }
      raf = requestAnimationFrame(frame);
    };

    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible && !raf) {
        prev = performance.now();
        raf = requestAnimationFrame(frame);
      }
    });
    io.observe(root);
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
    };
  }, [size, spacing, n]);

  // autoplay, back to the first print after the last; waits while someone is interacting
  React.useEffect(() => {
    if (!autoplay || n < 2) return;
    const t = window.setInterval(() => {
      if (document.hidden || drag.current || lbRef.current !== null || performance.now() - lastTouch.current < autoplay) return;
      goTo(activeRef.current >= n - 1 ? 0 : activeRef.current + 1);
    }, autoplay);
    return () => window.clearInterval(t);
  }, [autoplay, n, goTo]);

  const onDown = (e) => {
    if (e.target.closest(".pl-bar")) return;
    lastTouch.current = performance.now();
    drag.current = { x: e.clientX, off: sim.current.off, lx: e.clientX, lt: e.timeStamp, v: 0, moved: false };
  };
  const onMove = (e) => {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.x;
    if (!d.moved && Math.abs(dx) > 5) {
      d.moved = true;
      setDragging(true);
      rootRef.current?.setPointerCapture(e.pointerId);
    }
    if (!d.moved) return;
    const dt = Math.max(1, e.timeStamp - d.lt);
    d.v = 0.7 * ((e.clientX - d.lx) / dt) + 0.3 * d.v;
    d.lx = e.clientX;
    d.lt = e.timeStamp;
    const max = (n - 1) * spacing;
    let off = d.off - dx;
    if (off < 0) off *= 0.35;
    if (off > max) off = max + (off - max) * 0.35;
    sim.current.off = off;
  };
  const onUp = (e) => {
    const d = drag.current;
    drag.current = null;
    lastTouch.current = performance.now();
    if (!d) return;
    if (d.moved) {
      setDragging(false);
      sim.current.vel = -d.v * 1000;
      goTo(nearestAt(sim.current.off - d.v * 180, spacing, n));
      return;
    }
    const card = e.target.closest("[data-i]");
    if (card) {
      const i = Number(card.getAttribute("data-i"));
      goTo(i);
      setLb(i);
    }
  };
  const step = (dir) => {
    lastTouch.current = performance.now();
    goTo(clamp(activeRef.current + dir, 0, n - 1));
  };
  const onKey = (e) => {
    if (e.key === "ArrowRight") step(1);
    else if (e.key === "ArrowLeft") step(-1);
    else return;
    e.preventDefault();
  };

  if (!n) return null;
  const s = slides[active] || slides[0];

  const fadeUp = (dur = 0.8) => ({
    hidden: { opacity: 0, y: 18 },
    show: { opacity: 1, y: 0, transition: { duration: dur, ease: EASE } },
  });

  return (
    <section
      ref={rootRef}
      className="pl-root grain bg-forest-950"
      style={{ height: "100svh", minHeight: 660, ["--pl-cw"]: size.cw + "px" }}
      data-drag={dragging ? "1" : "0"}
      aria-roledescription="carousel"
      aria-label="Marrigold Events highlights"
      tabIndex={0}
      onKeyDown={onKey}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
    >
      <style>{PL_CSS}</style>

      {/* Backdrop: warm gold glow behind the heading, deep green falling away below */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_30%,rgba(203,166,39,0.17),transparent_70%),radial-gradient(110%_70%_at_50%_115%,rgba(43,82,61,0.55),transparent_65%)]" />

      {/* Heading zone (above the string) */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-30 flex justify-center px-6 text-center"
        style={{ height: size.top, paddingTop: size.narrow ? 100 : 108 }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            className="mx-auto max-w-4xl space-y-3 sm:space-y-4"
            initial={reduceMotion ? false : "hidden"}
            animate="show"
            exit={{ opacity: 0, transition: { duration: 0.2 } }}
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } } }}
          >
            <motion.span className="eyebrow-dark block" variants={fadeUp(0.7)}>
              Marrigold Events · Mumbai
            </motion.span>
            <h1 className="font-serif text-[1.85rem] font-medium leading-[1.08] tracking-tight text-cream-50 sm:text-5xl lg:text-[3.4rem]">
              {String(s.title).split(" ").map((w, k) => (
                <span key={k} className="inline-block overflow-hidden pb-[0.14em] -mb-[0.14em] align-bottom">
                  <motion.span
                    className="inline-block"
                    variants={{ hidden: { y: "110%" }, show: { y: "0%", transition: { duration: 1, ease: EASE } } }}
                  >
                    {w}&nbsp;
                  </motion.span>
                </span>
              ))}
            </h1>
            {s.subtitle && (
              <motion.p className="mx-auto line-clamp-2 max-w-xl text-base font-medium leading-relaxed text-cream-200 sm:text-lg" variants={fadeUp(0.9)}>
                {s.subtitle}
              </motion.p>
            )}
            {s.extra && (
              <motion.p className="mx-auto line-clamp-1 max-w-xl text-sm font-semibold tracking-wide text-gold-300" variants={fadeUp(0.9)}>
                {s.extra}
              </motion.p>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* The string + prints */}
      <svg className="pl-string" aria-hidden="true">
        <path ref={pathRef} fill="none" stroke="rgba(220,190,82,0.85)" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
      {slides.map((sl, i) => (
        <div
          key={sl.id ?? i}
          className="pl-card"
          data-i={i}
          data-on={i === active ? "1" : "0"}
          style={{ visibility: "hidden" }}
          ref={(el) => void (cards.current[i] = el)}
          aria-hidden={i === active ? undefined : true}
        >
          <div className="pl-print">
            <div className="pl-shot">
              <Image
                src={sl.image}
                alt={sl.title || ""}
                fill
                sizes="(max-width: 640px) 60vw, 320px"
                priority={i < 3}
                draggable={false}
              />
            </div>
            <div className="pl-note" aria-hidden="true" />
          </div>
          <div className="pl-peg" />
        </div>
      ))}

      {/* Bottom bar: button left, counter + arrows right */}
      <div
        className="pl-bar absolute inset-x-0 bottom-0 z-40 mx-auto flex max-w-7xl items-center gap-3 px-4 pb-6 sm:gap-4 sm:px-8 sm:pb-9"
        style={{ cursor: "default" }}
      >
        <div className="min-w-0 flex-1">
          {s.ctaText && (
            <Link href={s.ctaLink || "/gallery"} className="btn-gold">
              {s.ctaText}
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>
        {n > 1 && (
          <>
            <span className="hidden font-serif text-lg font-medium tabular-nums text-cream-50 sm:block" aria-hidden="true">
              {pad2(active + 1)}
              <span className="mx-1.5 text-cream-50/40">/</span>
              <span className="text-cream-50/65">{pad2(n)}</span>
            </span>
            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                onClick={() => step(-1)}
                aria-label="Previous"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-gold-500/60 text-cream-50 transition-all duration-300 hover:bg-gold-400 hover:text-forest-950 active:scale-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-400 sm:h-12 sm:w-12"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => step(1)}
                aria-label="Next"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-gold-500/60 text-cream-50 transition-all duration-300 hover:bg-gold-400 hover:text-forest-950 active:scale-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-400 sm:h-12 sm:w-12"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </>
        )}
      </div>

      <div className="sr-only" aria-live="polite">
        {"Slide " + (active + 1) + " of " + n + (s.title ? ": " + s.title : "")}
      </div>
      <AnimatePresence>
        {lb !== null && <PrintLightbox slide={slides[lb]} onClose={() => setLb(null)} />}
      </AnimatePresence>
    </section>
  );
}

/** Enlarged print. Close with the X, Esc, or by clicking anywhere around the photo. */
function PrintLightbox({ slide, onClose }) {
  const [mounted, setMounted] = React.useState(false);
  const closeRef = React.useRef(null);

  React.useEffect(() => {
    setMounted(true);
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  if (!mounted) return null;
  const stop = (e) => e.stopPropagation();

  return createPortal(
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-forest-950/92 p-4 backdrop-blur-sm sm:p-10"
      role="dialog"
      aria-modal="true"
      aria-label={slide.title || "Photo"}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      onClick={onClose}
      onPointerDown={stop}
      onPointerMove={stop}
      onPointerUp={stop}
      onKeyDown={stop}
    >
      <button
        ref={closeRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        aria-label="Close"
        className="absolute right-4 top-4 z-10 flex h-12 w-12 items-center justify-center rounded-full border border-gold-500/60 bg-forest-950/60 text-cream-50 transition-all duration-300 hover:bg-gold-400 hover:text-forest-950 active:scale-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-400 sm:right-6 sm:top-6"
      >
        <X className="h-5 w-5" />
      </button>
      <motion.div
        className="bg-cream-50 p-2 shadow-[0_40px_90px_-20px_rgba(0,0,0,0.8)] sm:p-3"
        initial={{ opacity: 0, scale: 0.92, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.4, ease: EASE }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={slide.image} alt={slide.title || ""} className="block max-h-[82vh] max-w-[88vw] object-contain" draggable={false} />
      </motion.div>
    </motion.div>,
    document.body
  );
}
