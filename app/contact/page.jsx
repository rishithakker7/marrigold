"use client";

import { Mail, Phone } from "lucide-react";
import { useSite } from "@/components/enquiry-context";
import EnquiryForm from "@/components/EnquiryForm";
import { Reveal, Stagger, StaggerItem } from "@/components/motion";
import { PageHero } from "@/components/ui";

export default function ContactPage() {
  const { data } = useSite();
  const c = data.contact || {};

  const cards = [
    c.phones?.length && {
      Icon: Phone,
      title: "Call Us",
      lines: c.phones.map((p) => ({ text: p, href: `tel:${p.replace(/\s/g, "")}` })),
    },
    c.email && { Icon: Mail, title: "Email", lines: [{ text: c.email, href: `mailto:${c.email}` }] },
  ].filter(Boolean);

  return (
    <>
      <PageHero
        eyebrow="Get in Touch"
        title="Let's Talk"
        text="Share your vision and our team will reach out to begin designing your celebration."
      />

      <section className="mx-auto grid max-w-7xl gap-12 px-6 py-20 sm:px-8 sm:py-28 lg:grid-cols-12">
        <div className="flex flex-col gap-4 lg:col-span-5">
          <Stagger className="space-y-4" gap={0.1}>
            {cards.map(({ Icon, title, lines }) => (
              <StaggerItem key={title} y={22}>
                <div className="group flex gap-5 border border-forest-200 bg-cream-50 p-6 transition-[border-color,box-shadow,transform] duration-500 hover:-translate-y-1 hover:border-gold-500/60 hover:shadow-gold">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-forest-950 text-gold-300">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="font-serif text-2xl text-forest-950">{title}</h3>
                    <div className="mt-1 space-y-0.5 text-sm font-normal text-forest-700">
                      {lines.map((l) =>
                        l.href ? (
                          <a key={l.text} href={l.href} className="block break-all transition-colors hover:text-gold-700">
                            {l.text}
                          </a>
                        ) : (
                          <p key={l.text}>{l.text}</p>
                        )
                      )}
                    </div>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </Stagger>

          {c.mapEmbedUrl && (
            <Reveal className="relative min-h-[320px] flex-1" y={22}>
              <div className="absolute inset-0 overflow-hidden border border-forest-200">
                <iframe
                  src={c.mapEmbedUrl}
                  title="Marrigold Events location"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="absolute inset-0 h-full w-full border-0"
                />
              </div>
            </Reveal>
          )}
        </div>

        <Reveal className="lg:col-span-7" y={36}>
          <div className="grain relative overflow-hidden bg-forest-950 p-7 shadow-lift sm:p-10">
            <div className="absolute inset-0 bg-[radial-gradient(60%_50%_at_100%_0%,rgba(203,166,39,0.16),transparent_70%)]" />
            <div className="relative z-10">
              <span className="eyebrow-dark">Enquiry</span>
              <h2 className="mb-8 mt-2 font-serif text-4xl font-normal text-cream-100">Plan Your Celebration</h2>
              <EnquiryForm />
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}
