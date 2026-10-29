"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { initialSiteData } from "@/lib/data.js";
import EnquiryDrawer from "./EnquiryDrawer";

const SiteContext = createContext(null);

/**
 * Provides live site content (admin overrides) and one shared enquiry drawer,
 * so every "Enquire" button on every page opens the same panel.
 */
export function SiteProvider({ children }) {
  const [data, setData] = useState(initialSiteData);
  const [open, setOpen] = useState(false);
  const [service, setService] = useState(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/admin/content")
      .then((res) => (res.ok ? res.json() : null))
      .then((live) => {
        if (alive && live) setData(live);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const openEnquiry = useCallback((svc) => {
    setService(typeof svc === "string" ? svc : null);
    setOpen(true);
  }, []);
  const closeEnquiry = useCallback(() => setOpen(false), []);

  const value = useMemo(
    () => ({ data, openEnquiry, closeEnquiry }),
    [data, openEnquiry, closeEnquiry]
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
