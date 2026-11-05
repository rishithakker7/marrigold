"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { initialSiteData } from "@/lib/data.js";

const EnquiryDrawer = dynamic(() => import("./EnquiryDrawer"), { ssr: false });

const SiteContext = createContext(null);

/**
 * Provides static site content and one shared enquiry drawer,
 * so every "Enquire" button on every page opens the same panel.
 */
export function SiteProvider({ children }) {
  const [open, setOpen] = useState(false);
  const [service, setService] = useState(null);

  const openEnquiry = useCallback((svc) => {
    setService(typeof svc === "string" ? svc : null);
    setOpen(true);
  }, []);
  const closeEnquiry = useCallback(() => setOpen(false), []);

  const value = useMemo(
    () => ({ data: initialSiteData, openEnquiry, closeEnquiry }),
    [openEnquiry, closeEnquiry]
  );

  return (
    <SiteContext.Provider value={value}>
      {children}
      <EnquiryDrawer isOpen={open} onClose={closeEnquiry} defaultService={service} />
    </SiteContext.Provider>
  );
}

export function useSite() {
  const ctx = useContext(SiteContext);
  if (!ctx) throw new Error("useSite must be used inside <SiteProvider>");
  return ctx;
}
