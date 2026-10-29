"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { EASE } from "./motion";

/** Full-screen viewer. Rendered in a portal so transformed parents can't break `fixed`. */
export default function Lightbox({ items, index, onClose, onIndex }) {
  const [mounted, setMounted] = useState(false);
  const open = index !== null && index !== undefined && items[index];

  useEffect(() => setMounted(true), []);

  const go = useCallback(
    (dir) => onIndex((index + dir + items.length) % items.length),
    [index, items.length, onIndex]
  );

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, go, onClose]);

  if (!mounted) return null;
  const item = open ? items[index] : null;

  return createPortal(
    <AnimatePresence>
      {item && (
        <motion.div
          key="lightbox"
          className="fixed inset-0 z-[90] flex flex-col bg-forest-950/95 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          role="dialog"
          aria-modal="true"
          aria-label={item.title}
        >
          <div className="flex items-center justify-between px-5 py-4 text-cream-100">
            <span className="text-xs tracking-[0.25em] text-forest-200">
              {String(index + 1).padStart(2, "0")} / {String(items.length).padStart(2, "0")}
            </span>
            <button
              onClick={onClose}
              aria-label="Close"
              className="rounded-full p-3 transition-[background-color,transform] duration-200 hover:bg-forest-800 active:scale-90"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="relative flex-1 min-h-0" style={{ touchAction: "pan-y" }}>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={item.id}
                className="absolute inset-0"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3, ease: EASE }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.25}
                onDragEnd={(_, info) => {
                  if (info.offset.x < -70) go(1);
                  else if (info.offset.x > 70) go(-1);
                }}
              >
                <Image
                  src={item.url}
                  alt={item.title || "Gallery image"}
                  fill
                  sizes="100vw"
                  className="select-none object-contain px-2 sm:px-20"
                  draggable={false}
                  priority
                />
              </motion.div>
            </AnimatePresence>

            {items.length > 1 && (
              <>
                <button
                  onClick={() => go(-1)}
                  aria-label="Previous"
                  className="absolute left-3 top-1/2 hidden -translate-y-1/2 rounded-full border border-forest-700 bg-forest-950/60 p-3 text-cream-100 transition-[border-color,color,transform] hover:border-gold-400 hover:text-gold-300 active:scale-90 sm:block"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  onClick={() => go(1)}
                  aria-label="Next"
                  className="absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-full border border-forest-700 bg-forest-950/60 p-3 text-cream-100 transition-[border-color,color,transform] hover:border-gold-400 hover:text-gold-300 active:scale-90 sm:block"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}
          </div>

          <div className="px-6 pt-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] text-center">
            <h3 className="font-serif text-2xl font-normal text-cream-100">{item.title}</h3>
            {item.caption && <p className="mx-auto mt-1 max-w-xl text-sm font-normal text-forest-200">{item.caption}</p>}
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
