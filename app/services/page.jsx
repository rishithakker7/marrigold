"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Plus } from "lucide-react";
import { useSite } from "@/components/enquiry-context";
import { EASE } from "@/components/motion";
import { PageHero } from "@/components/ui";

const enquiryLabel = (id) =>
  id === "destination-wedding" ? "Destination Wedding" : id === "decorator" ? "Artisanal Decor & DIY Styling" : undefined;

export default function ServicesPage() {
  const { data, openEnquiry } = useSite();
  const reduce = useReducedMotion();
  const services = data.services || [];
  const tabsRef = useRef(null);
  const [activeId, setActiveId] = useState(null);
  const [openItem, setOpenItem] = useState(0);

  // Deep links from the home page: /services#decorator opens that tab
  useEffect(() => {
    const fromHash = () => {
      const h = window.location.hash.replace("#", "");
      if (h) {
        setActiveId(h);
        setOpenItem(0);
      }
    };
    fromHash();
    if (window.location.hash) setTimeout(() => tabsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 350);
    window.addEventListener("hashchange", fromHash);
    return () => window.removeEventListener("hashchange", fromHash);
  }, []);

  const active = services.find((s) => s.id === activeId) || services[0];

  const select = (id) => {
    setActiveId(id);
    setOpenItem(0);
    window.history.replaceState(null, "", `#${id}`);
  };

  const rise = (delay = 0) => ({
    initial: reduce ? false : { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.7, delay, ease: EASE },
  });

  return (
    <>
      <PageHero
        eyebrow="Our Expertise"
        title="Services"
        text="Planning, decor and destination celebrations — each led by specialists, all under one roof."
      />

      {active && (
        <section className="bg-cream-50 pb-24 sm:pb-32">
          {/* Simple text tabs with a sliding gold underline */}
          <div ref={tabsRef} className="mx-auto max-w-5xl scroll-mt-24 px-4 pt-8 sm:px-8 sm:pt-12">
            <div className="border-b border-forest-200">
            <div
              role="tablist"
              aria-label="Services"
              className="flex justify-start gap-1 overflow-x-auto overflow-y-hidden [scrollbar-width:none] sm:justify-center sm:gap-4 [&::-webkit-scrollbar]:hidden"
            >
              {services.map((s) => {
                const on = s.id === active.id;
                return (
                  <button
                    key={s.id}
                    role="tab"
                    id={`tab-${s.id}`}
                    aria-selected={on}
                    aria-controls="service-panel"
                    onClick={() => select(s.id)}
                    className={`relative shrink-0 whitespace-nowrap px-4 py-4 font-serif text-lg font-medium outline-none transition-colors duration-300 focus-visible:bg-cream-200 sm:px-6 sm:text-2xl ${
                      on ? "text-forest-950" : "text-forest-600 hover:text-gold-700"
                    }`}
                  >
                    {s.title}
                    {on && (
                      <motion.span
                        layoutId="service-tab-bar"
                        transition={{ duration: 0.45, ease: EASE }}
                        className="absolute inset-x-0 bottom-0 h-[3px] bg-gold-500"
                      />
                    )}
                  </button>
                );
              })}
            </div>
            </div>
          </div>

          {/* Panel */}
          <div className="mx-auto max-w-7xl px-6 pt-12 sm:px-8 sm:pt-16">
            <AnimatePresence mode="wait">
              <motion.div
                key={active.id}
                id="service-panel"
                role="tabpanel"
                aria-labelledby={`tab-${active.id}`}
                className="grid items-start gap-10 lg:grid-cols-12 lg:gap-16"
                exit={{ opacity: 0, transition: { duration: 0.2 } }}
              >
                {/* Image: wipes open on every switch */}
                <div className="lg:col-span-5 lg:sticky lg:top-28">
                  <div className="relative">
                    <motion.div
                      className="relative aspect-[4/5] overflow-hidden bg-forest-900 shadow-lift"
                      initial={reduce ? false : { clipPath: "inset(0 0 100% 0)" }}
                      animate={{ clipPath: "inset(0 0 0% 0)" }}
                      transition={{ duration: 1, ease: EASE }}
                    >
                      <motion.div
                        className="absolute inset-0"
                        initial={reduce ? false : { scale: 1.25 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 1.6, ease: EASE }}
                      >
                        <Image src={active.image} alt={active.title} fill sizes="(min-width:1024px) 40vw, 100vw" className="object-cover" />
                      </motion.div>
                    </motion.div>
                    <motion.div
                      className="absolute -bottom-4 -right-4 -z-10 h-full w-full border border-gold-500/60"
                      initial={reduce ? false : { opacity: 0, x: -16, y: -16 }}
                      animate={{ opacity: 1, x: 0, y: 0 }}
                      transition={{ duration: 0.9, delay: 0.5, ease: EASE }}
                    />
                  </div>
                </div>

                {/* Copy + items */}
                <div className="space-y-8 lg:col-span-7">
                  <div className="space-y-4">
                    <motion.p {...rise(0.1)} className="font-serif text-xl font-medium text-gold-700">
                      {active.subtitle}
                    </motion.p>
                    <motion.h2 {...rise(0.18)} className="font-serif text-4xl font-medium leading-tight text-forest-950 sm:text-5xl lg:text-6xl">
                      {active.title}
                    </motion.h2>
                    <motion.p {...rise(0.26)} className="max-w-2xl text-lg leading-relaxed text-forest-800">
                      {active.description}
                    </motion.p>
                  </div>

                  <motion.ul {...rise(0.34)} className="divide-y divide-forest-200 border-y border-forest-200">
                    {(active.items || []).map((it, k) => {
                      const open = openItem === k;
                      return (
                        <li key={it.id} className="group relative">
                          <span className={`absolute left-0 top-0 h-px bg-gold-500 transition-[width] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${open ? "w-full" : "w-0 group-hover:w-full"}`} />
                          <button
                            onClick={() => setOpenItem(open ? -1 : k)}
                            aria-expanded={open}
                            className="flex w-full items-center justify-between gap-6 py-5 text-left outline-none focus-visible:bg-cream-200"
                          >
                            <span className={`font-serif text-2xl font-medium transition-all duration-300 group-hover:translate-x-1.5 ${open ? "text-gold-700" : "text-forest-950"}`}>
                              {it.title}
                            </span>
                            <span
                              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-all duration-300 ${
                                open ? "rotate-45 border-gold-500 bg-gold-400 text-forest-950" : "border-forest-300 text-forest-700 group-hover:border-gold-500"
                              }`}
                            >
                              <Plus className="h-4 w-4" />
                            </span>
                          </button>
                          <AnimatePresence initial={false}>
                            {open && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.45, ease: EASE }}
                                className="overflow-hidden"
                              >
                                <p className="max-w-xl pb-6 text-base leading-relaxed text-forest-800">{it.description}</p>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </li>
                      );
                    })}
                  </motion.ul>

                  <motion.div {...rise(0.42)}>
                    <button onClick={() => openEnquiry(enquiryLabel(active.id))} className="btn-dark">
                      Enquire about {active.title}
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </motion.div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </section>
      )}
    </>
  );
}
