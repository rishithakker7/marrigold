"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MessageCircle } from "lucide-react";
import { useSite } from "./enquiry-context";
import { EASE } from "./motion";

/** WhatsApp shortcut — the fastest way for a lead to reach you. Appears after a little scrolling. */
export default function FloatingActions() {
  const { data } = useSite();
  const [show, setShow] = useState(false);
  const phone = (data.contact?.phones?.[0] || "").replace(/\D/g, "");

  useEffect(() => {
    const on = () => setShow(window.scrollY > 500);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  if (!phone) return null;
  const href = `https://wa.me/${phone}?text=${encodeURIComponent("Hi Marrigold Events, I'd like to plan my wedding.")}`;

  return (
    <AnimatePresence>
      {show && (
        <motion.a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Chat on WhatsApp"
          className="fixed right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lift sm:right-6"
          style={{ bottom: "max(1.25rem, env(safe-area-inset-bottom))" }}
          initial={{ opacity: 0, scale: 0.6, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.4, ease: EASE }}
          whileTap={{ scale: 0.92 }}
        >
          <span className="animate-ring absolute inset-0 rounded-full bg-[#25D366]" aria-hidden="true" />
          <MessageCircle className="relative h-6 w-6" />
        </motion.a>
      )}
    </AnimatePresence>
  );
}
