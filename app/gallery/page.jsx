"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { Expand } from "lucide-react";
import { useSite } from "@/components/enquiry-context";
import { EASE } from "@/components/motion";
import { PageHero } from "@/components/ui";
import { BLUR_DATA_URL } from "@/lib/utils";

const Lightbox = dynamic(() => import("@/components/Lightbox"), { ssr: false });

const RATIOS = ["aspect-[4/5]", "aspect-square", "aspect-[3/4]", "aspect-[4/3]", "aspect-[5/6]"];
const BATCH_SIZE = 12;

export default function GalleryPage() {
  const { data } = useSite();
  const [cat, setCat] = useState("All");
  const [lb, setLb] = useState(null);
  const [visibleCount, setVisibleCount] = useState(BATCH_SIZE);
  const sentinelRef = useRef(null);

  const categories = data.categories?.length ? data.categories : ["All"];
  const items = useMemo(() => {
    const imgs = (data.gallery || []).filter((g) => g.type !== "video");
    const sorted = [...imgs].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    return cat === "All" ? sorted : sorted.filter((g) => g.category === cat);
  }, [data.gallery, cat]);

  // Reset batch count when category changes
  useEffect(() => {
    setVisibleCount(BATCH_SIZE);
  }, [cat]);

  // Progressive reveal as user scrolls near bottom
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || visibleCount >= items.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((prev) => Math.min(prev + BATCH_SIZE, items.length));
        }
      },
      { rootMargin: "300px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [visibleCount, items.length]);

  const visibleItems = items.slice(0, visibleCount);
  const hasMore = visibleCount < items.length;

  return (
    <>
      <PageHero
        eyebrow="Our Portfolio"
        title="The Gallery"
        text="A glimpse into the celebrations we've designed — from intimate mehendis to grand receptions."
      />

      <section className="mx-auto max-w-7xl px-5 py-20 sm:px-10 sm:py-28">
        <LayoutGroup>
          <div className="-mx-5 mb-16 flex gap-3 overflow-x-auto px-5 pb-2 sm:mx-0 sm:flex-wrap sm:justify-center sm:overflow-visible sm:px-0" role="tablist">
            {categories.map((c) => (
              <button
                key={c}
                role="tab"
                aria-selected={cat === c}
                onClick={() => setCat(c)}
                className={`relative shrink-0 px-6 py-3 text-[13px] font-semibold uppercase tracking-[0.14em] transition-colors duration-300 ${
                  cat === c ? "text-forest-950" : "text-forest-600 hover:text-forest-900"
                }`}
              >
                {cat === c && (
                  <motion.span
                    layoutId="cat-pill"
                    className="absolute inset-0 -z-0 rounded-full bg-gold-300"
                    style={{ borderRadius: 9999 }}
                    transition={{ duration: 0.4, ease: EASE }}
                  />
                )}
                <span className="relative z-10">{c}</span>
              </button>
            ))}
          </div>
        </LayoutGroup>

        <div className="columns-2 gap-5 sm:gap-8 lg:columns-3">
          <AnimatePresence mode="popLayout" initial={false}>
            {visibleItems.map((g, i) => (
              <motion.button
                key={g.id}
                onClick={() => setLb(i)}
                aria-label={`Open ${g.title}`}
                className="group relative mb-5 block w-full break-inside-avoid overflow-hidden bg-forest-100 text-left sm:mb-8"
                style={{ borderRadius: 24 }}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "0px 0px -4% 0px" }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.6, ease: EASE }}
              >
                <div className={`relative ${RATIOS[i % RATIOS.length]}`}>
                  <Image
                    src={g.url}
                    alt={g.title || "Wedding decor"}
                    fill
                    sizes="(min-width:1024px) 33vw, 50vw"
                    priority={i === 0}
                    loading={i === 0 ? "eager" : "lazy"}
                    quality={75}
                    placeholder="blur"
                    blurDataURL={BLUR_DATA_URL}
                    className="object-cover scale-[1.12] transition-transform duration-[1000ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.2]"
                  />
                </div>
                <div className="absolute inset-0 flex items-end justify-between bg-gradient-to-t from-forest-950/85 via-forest-950/10 to-transparent p-5 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                  <div>
                    <span className="eyebrow-dark block">{g.category}</span>
                    <span className="block font-serif text-xl text-cream-100">{g.title}</span>
                    {g.caption && <span className="mt-0.5 block text-sm text-cream-200">{g.caption}</span>}
                  </div>
                  <Expand className="h-5 w-5 text-gold-300" />
                </div>
              </motion.button>
            ))}
          </AnimatePresence>
        </div>

        {/* Sentinel for progressive scroll-reveal */}
        {hasMore && <div ref={sentinelRef} className="h-10 w-full" aria-hidden="true" />}

        {hasMore && (
          <div className="mt-12 text-center">
            <button
              onClick={() => setVisibleCount((c) => Math.min(c + BATCH_SIZE, items.length))}
              className="btn-gold inline-flex"
            >
              Load More Moments ({items.length - visibleCount} remaining)
            </button>
          </div>
        )}

        {items.length === 0 && <p className="py-20 text-center text-forest-600">Nothing here yet — check back soon.</p>}
      </section>

      {lb !== null && <Lightbox items={items} index={lb} onClose={() => setLb(null)} onIndex={setLb} />}
    </>
  );
}
