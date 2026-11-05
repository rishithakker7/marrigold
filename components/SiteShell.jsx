"use client";

import { motion, useScroll, useSpring } from "framer-motion";
import { SiteProvider } from "./enquiry-context";
import Navbar from "./Navbar";
import Footer from "./Footer";
import FloatingActions from "./FloatingActions";

/** Wraps public pages with chrome. Admin routes keep their own layout. */
export default function SiteShell({ children }) {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 140, damping: 30, mass: 0.3 });

  return (
    <SiteProvider>
      <motion.div
        style={{ scaleX }}
        className="fixed inset-x-0 top-0 z-[60] h-[2px] origin-left bg-gradient-to-r from-gold-500 via-gold-300 to-gold-500"
        aria-hidden="true"
      />
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
      <FloatingActions />
    </SiteProvider>
  );
}
