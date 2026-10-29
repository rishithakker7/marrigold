"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, Phone, X } from "lucide-react";
import { useSite } from "./enquiry-context";
import { EASE } from "./motion";

const LINKS = [
  { name: "Home", href: "/" },
  { name: "Services", href: "/services" },
  { name: "Gallery", href: "/gallery" },
  { name: "Contact", href: "/contact" },
];

/** Pill nav with a gold cursor that slides to the hovered link, and rests on the current page. */
function SlideTabs({ links, isActive }) {
  const refs = useRef([]);
  const first = useRef(true);
  const [hover, setHover] = useState(null);
  const [pos, setPos] = useState({ left: 0, width: 0, opacity: 0 });

  const activeIdx = links.findIndex((l) => isActive(l.href));
  const target = hover ?? (activeIdx >= 0 ? activeIdx : null);

  const measure = useCallback(() => {
    const el = target != null ? refs.current[target] : null;
    if (el) setPos({ left: el.offsetLeft, width: el.offsetWidth, opacity: 1 });
    else setPos((p) => ({ ...p, opacity: 0 }));
    requestAnimationFrame(() => {
      first.current = false;
    });
  }, [target]);

  useEffect(() => {
    measure();
  }, [measure]);

  useEffect(() => {
    window.addEventListener("resize", measure);
    document.fonts?.ready.then(measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure]);

  return (
    <ul
      onMouseLeave={() => setHover(null)}
      className="relative flex items-center rounded-full border border-gold-500/40 bg-forest-950/55 p-1 shadow-[0_10px_40px_-16px_rgba(0,0,0,0.8)] backdrop-blur-md"
    >
      {links.map((l, i) => (
        <li key={l.href} ref={(el) => (refs.current[i] = el)} onMouseEnter={() => setHover(i)} className="relative z-10">
          <Link
            href={l.href}
            onFocus={() => setHover(i)}
            onBlur={() => setHover(null)}
            className={`block rounded-full px-5 py-2.5 text-[13px] font-semibold uppercase tracking-[0.14em] outline-none transition-colors duration-300 ${
              target === i ? "text-forest-950" : "text-cream-100"
            }`}
          >
            {l.name}
          </Link>
        </li>
      ))}
      <motion.li
        aria-hidden="true"
        role="presentation"
        initial={false}
        animate={pos}
        transition={first.current ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 34 }}
        className="absolute top-1 bottom-1 z-0 rounded-full bg-gradient-to-r from-gold-400 via-gold-300 to-gold-400 shadow-[0_6px_20px_-6px_rgba(203,166,39,0.8)]"
      />
    </ul>
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const { data, openEnquiry } = useSite();
  const [scrolled, setScrolled] = useState(false);
  const [menu, setMenu] = useState(false);
  const phone = data.contact?.phones?.[0] || "";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setMenu(false), [pathname]);

  useEffect(() => {
    document.body.style.overflow = menu ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menu]);

  const active = (href) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-[background-color,box-shadow,backdrop-filter] duration-500 ${
          scrolled || menu
            ? "bg-forest-950/80 shadow-[0_1px_0_rgba(203,166,39,0.18)] backdrop-blur-xl"
            : "bg-transparent"
        }`}
      >
        <div
          className={`mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 sm:px-8 transition-[padding] duration-500 ${
            scrolled ? "py-2.5 sm:py-3" : "py-3.5 sm:py-5"
          }`}
        >
          <Link href="/" className="flex min-w-0 shrink items-center" aria-label="Marrigold Events home">
            <Image
              src="/images/logo.png"
              alt="Marrigold Events"
              width={400}
              height={118}
              priority
              className={`w-auto object-contain drop-shadow-[0_2px_14px_rgba(0,0,0,0.45)] transition-[height] duration-500 ${
                scrolled ? "h-[clamp(1.75rem,7vw,3rem)]" : "h-[clamp(2rem,8vw,3.5rem)]"
              }`}
            />
          </Link>

          <nav className="hidden md:block" aria-label="Main">
            <SlideTabs links={LINKS} isActive={active} />
          </nav>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            {phone && (
              <a
                href={`tel:${phone.replace(/\s/g, "")}`}
                className="hidden items-center gap-2 text-[14px] tracking-wide text-cream-100/90 transition-colors hover:text-gold-300 lg:flex"
              >
                <Phone className="h-3.5 w-3.5 text-gold-400" />
                {phone}
              </a>
            )}
            <button onClick={() => openEnquiry()} className="btn-gold btn-gold-sm inline-flex">
              Enquire Now
            </button>
            <button
              onClick={() => setMenu((m) => !m)}
              aria-label={menu ? "Close menu" : "Open menu"}
              aria-expanded={menu}
              className="-mr-2 rounded-full p-3 text-cream-100 transition-transform active:scale-90 md:hidden"
            >
              {menu ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {menu && (
          <motion.div
            className="fixed inset-0 z-40 flex flex-col bg-forest-950/97 pt-28 px-8 pb-[max(2rem,env(safe-area-inset-bottom))] md:hidden"
            style={{ backgroundColor: "rgba(8,21,14,0.97)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <nav className="flex flex-1 flex-col justify-center gap-2" aria-label="Mobile">
              {LINKS.map((l, i) => (
                <motion.div
                  key={l.href}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.06 + i * 0.06, ease: EASE }}
                >
                  <Link
                    href={l.href}
                    className={`block border-b border-forest-800 py-4 font-serif text-4xl font-normal ${
                      active(l.href) ? "text-gold-300" : "text-cream-100"
                    }`}
                  >
                    {l.name}
                  </Link>
                </motion.div>
              ))}
            </nav>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.35, ease: EASE }}
              className="space-y-4"
            >
              <button
                onClick={() => {
                  setMenu(false);
                  openEnquiry();
                }}
                className="btn-gold w-full"
              >
                Enquire Now
              </button>
              {phone && (
                <a href={`tel:${phone.replace(/\s/g, "")}`} className="block text-center text-sm tracking-wider text-forest-200">
                  {phone}
                </a>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
