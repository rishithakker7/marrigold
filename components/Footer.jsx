"use client";

import Link from "next/link";
import { Facebook, Instagram, Mail, MapPin, Phone } from "lucide-react";
import { useSite } from "./enquiry-context";
import { Reveal } from "./motion";

function Pinterest(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M12 2a10 10 0 0 0-3.64 19.3c-.09-.82-.17-2.08.03-2.98l1.2-5.08s-.3-.61-.3-1.52c0-1.42.83-2.49 1.86-2.49.88 0 1.3.66 1.3 1.45 0 .88-.56 2.2-.85 3.43-.24 1.02.52 1.86 1.52 1.86 1.83 0 3.23-1.93 3.23-4.7 0-2.46-1.77-4.18-4.29-4.18-2.92 0-4.64 2.19-4.64 4.45 0 .88.34 1.83.76 2.34.08.1.09.19.07.29l-.28 1.16c-.04.18-.15.22-.34.13-1.28-.6-2.08-2.47-2.08-3.97 0-3.23 2.35-6.2 6.78-6.2 3.56 0 6.33 2.54 6.33 5.93 0 3.54-2.23 6.39-5.33 6.39-1.04 0-2.02-.54-2.35-1.18l-.64 2.44c-.23.89-.86 2-1.28 2.68A10 10 0 1 0 12 2z" />
    </svg>
  );
}

export default function Footer() {
  const { data, openEnquiry } = useSite();
  const c = data.contact || {};
  const s = c.socials || {};
  const social = [
    { href: s.instagram, label: "Instagram", Icon: Instagram },
    { href: s.facebook, label: "Facebook", Icon: Facebook },
    { href: s.pinterest, label: "Pinterest", Icon: Pinterest },
  ].filter((x) => x.href);

  return (
    <footer className="grain relative overflow-hidden bg-forest-950 text-forest-200">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold-500/60 to-transparent" />
      <div className="relative z-10 mx-auto max-w-7xl px-6 sm:px-8 pt-20 pb-10">
        <Reveal>
          <div className="mb-16 flex flex-col items-start justify-between gap-8 border-b border-forest-800 pb-16 md:flex-row md:items-end">
            <h2 className="max-w-2xl font-serif text-4xl font-normal leading-tight text-cream-100 sm:text-5xl lg:text-6xl">
              Let&apos;s design a day <span className="italic gold-gradient-text">you&apos;ll never forget.</span>
            </h2>
            <button onClick={() => openEnquiry()} className="btn-gold shrink-0">
              Begin Your Story
            </button>
          </div>
        </Reveal>

        <div className="grid gap-12 md:grid-cols-12">
          <div className="space-y-5 md:col-span-5">
            <div className="font-serif text-3xl text-cream-100">Marrigold Events</div>
            <p className="max-w-sm text-sm font-normal leading-relaxed">
              Bespoke wedding planning, in-house decor artistry and destination celebrations, crafted from our atelier in Mulund West, Mumbai.
            </p>
            <div className="flex gap-3 pt-2">
              {social.map(({ href, label, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-forest-700 text-forest-200 transition-[color,border-color,transform] duration-300 hover:-translate-y-0.5 hover:border-gold-400 hover:text-gold-300"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          <div className="space-y-4 md:col-span-3">
            <h3 className="eyebrow-dark font-sans">Explore</h3>
            <ul className="space-y-3 text-sm">
              {[
                ["Home", "/"],
                ["Services", "/services"],
                ["Gallery", "/gallery"],
                ["Contact", "/contact"],
              ].map(([n, h]) => (
                <li key={h}>
                  <Link href={h} className="link-underline transition-colors hover:text-gold-300">
                    {n}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-4 md:col-span-4">
            <h3 className="eyebrow-dark font-sans">Visit & Call</h3>
            <ul className="space-y-4 text-sm font-normal">
              {c.address && (
                <li className="flex gap-3">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold-400" />
                  <span>{c.address}</span>
                </li>
              )}
              {(c.phones || []).map((p) => (
                <li key={p} className="flex gap-3">
                  <Phone className="mt-0.5 h-4 w-4 shrink-0 text-gold-400" />
                  <a href={`tel:${p.replace(/\s/g, "")}`} className="transition-colors hover:text-gold-300">
                    {p}
                  </a>
                </li>
              ))}
              {c.email && (
                <li className="flex gap-3">
                  <Mail className="mt-0.5 h-4 w-4 shrink-0 text-gold-400" />
                  <a href={`mailto:${c.email}`} className="break-all transition-colors hover:text-gold-300">
                    {c.email}
                  </a>
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="mt-16 flex flex-col items-center justify-between gap-3 border-t border-forest-800 pt-8 text-xs tracking-wider text-forest-400 sm:flex-row">
          <span>© {new Date().getFullYear()} Marrigold Events. All rights reserved.</span>
          <span className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
            <Link href="/privacy" className="link-underline transition-colors hover:text-gold-300">
              Privacy Policy
            </Link>
            <span>Mulund West · Mumbai</span>
            <Link href="/admin/login" className="rounded-full border border-forest-700 px-3 py-1 font-semibold uppercase tracking-[0.14em] text-forest-300 transition-colors hover:border-gold-400 hover:text-gold-300">
              CMS
            </Link>
          </span>
        </div>
      </div>
    </footer>
  );
}
