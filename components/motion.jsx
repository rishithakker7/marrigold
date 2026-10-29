"use client";

import { useEffect, useRef } from "react";
import {
  animate,
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from "framer-motion";

// Strong ease-out: fast start, long settle. Used for every entrance.
export const EASE = [0.22, 1, 0.36, 1];

const VIEWPORT = { once: true, amount: 0.12, margin: "0px 0px -4% 0px" };

/** Fade + rise when scrolled into view. */
export function Reveal({ children, delay = 0, y = 28, className = "", as = "div" }) {
  const reduce = useReducedMotion();
  const Comp = motion[as] || motion.div;
  return (
    <Comp
      className={className}
      initial={reduce ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={VIEWPORT}
      transition={{ duration: 0.55, delay: delay * 0.6, ease: EASE }}
    >
      {children}
    </Comp>
  );
}

/** Parent that staggers its <StaggerItem> children. */
export function Stagger({ children, className = "", gap = 0.12, delay = 0, as = "div" }) {
  const reduce = useReducedMotion();
  const Comp = motion[as] || motion.div;
  return (
    <Comp
      className={className}
      initial={reduce ? false : "hidden"}
      whileInView="show"
      viewport={VIEWPORT}
      variants={{ hidden: {}, show: { transition: { staggerChildren: gap * 0.6, delayChildren: delay * 0.6 } } }}
    >
      {children}
    </Comp>
  );
}

export function StaggerItem({ children, className = "", y = 34, as = "div" }) {
  const Comp = motion[as] || motion.div;
  return (
    <Comp
      className={className}
      variants={{
        hidden: { opacity: 0, y },
        show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } },
      }}
    >
      {children}
    </Comp>
  );
}

/** Headline that rises word by word out of a mask. */
export function RevealText({
  text,
  className = "",
  as = "h2",
  delay = 0,
  stagger = 0.07,
  immediate = false,
}) {
  const reduce = useReducedMotion();
  const Comp = motion[as] || motion.h2;
  const words = String(text).split(" ");
  const trigger = immediate
    ? { animate: "show" }
    : { whileInView: "show", viewport: { once: true, amount: 0.6 } };

  return (
    <Comp
      className={className}
      aria-label={text}
      initial={reduce ? false : "hidden"}
      {...trigger}
      variants={{ hidden: {}, show: { transition: { staggerChildren: stagger * 0.6, delayChildren: delay * 0.6 } } }}
    >
      {words.map((word, i) => (
        <span
          key={`${word}-${i}`}
          aria-hidden="true"
          className="inline-block overflow-hidden align-bottom pb-[0.14em] -mb-[0.14em]"
        >
          <motion.span
            className="inline-block"
            variants={{
              hidden: { y: "112%" },
              show: { y: "0%", transition: { duration: 0.65, ease: EASE } },
            }}
          >
            {word}
          </motion.span>
          {i < words.length - 1 ? " " : null}
        </span>
      ))}
    </Comp>
  );
}

/** Button/link wrapper that leans toward the cursor (mouse only). */
export function Magnetic({ children, strength = 0.22, className = "" }) {
  const ref = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 220, damping: 18, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 220, damping: 18, mass: 0.4 });

  const onMove = (e) => {
    if (e.pointerType !== "mouse" || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    x.set((e.clientX - (r.left + r.width / 2)) * strength);
    y.set((e.clientY - (r.top + r.height / 2)) * strength);
  };
  const onLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      style={{ x: sx, y: sy }}
      className={`inline-block ${className}`}
    >
      {children}
    </motion.div>
  );
}

/** Number that counts up when it scrolls into view. */
export function CountUp({ to, suffix = "", duration = 1.4 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -10% 0px" });
  const reduce = useReducedMotion();

  useEffect(() => {
    if (!inView || !ref.current) return;
    if (reduce) {
      ref.current.textContent = `${to}${suffix}`;
      return;
    }
    const controls = animate(0, to, {
      duration,
      ease: EASE,
      onUpdate: (v) => {
        if (ref.current) ref.current.textContent = `${Math.round(v)}${suffix}`;
      },
    });
    return () => controls.stop();
  }, [inView, to, suffix, duration, reduce]);

  return <span ref={ref}>{`0${suffix}`}</span>;
}
