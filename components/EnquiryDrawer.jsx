"use client";

import { useEffect } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import EnquiryForm from "./EnquiryForm";
import { EASE } from "./motion";

export default function EnquiryDrawer({ isOpen, onClose, defaultService }) {
  const reduce = useReducedMotion();

  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[80]" role="dialog" aria-modal="true" aria-label="Enquiry form">
          <motion.div
            className="absolute inset-0 bg-forest-950/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
          />
          <motion.aside
            className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col border-l border-forest-800 bg-forest-950 text-forest-100 shadow-2xl"
            initial={reduce ? { opacity: 0 } : { x: "100%" }}
            animate={reduce ? { opacity: 1 } : { x: 0 }}
            exit={reduce ? { opacity: 0 } : { x: "100%" }}
            transition={{ duration: 0.45, ease: EASE }}
          >
            <div className="flex items-center justify-between border-b border-forest-800 bg-gradient-to-b from-forest-900 to-forest-950 p-6">
              <div className="space-y-1">
                <span className="eyebrow-dark">Marrigold Atelier</span>
                <h3 className="font-serif text-3xl font-normal text-cream-100">Plan Your Celebration</h3>
              </div>
              <button
                onClick={onClose}
                aria-label="Close"
                className="rounded-full p-3 text-forest-200 transition-[color,background-color,transform] duration-200 hover:bg-forest-800 hover:text-white active:scale-95"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto overscroll-contain p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
              <p className="mb-6 text-sm font-normal leading-relaxed text-forest-200">
                Share a few details and our team will call you back to begin designing your day.
              </p>
              <EnquiryForm defaultService={defaultService} onSuccess={onClose} />
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
