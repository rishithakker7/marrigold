"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertCircle, CheckCircle2, Send } from "lucide-react";

export const SERVICE_OPTIONS = [
  "Complete Wedding Planning",
  "Customized Wedding Planning",
  "Day-Of Coordination",
  "Artisanal Decor & DIY Styling",
  "Destination Wedding",
  "Personalized Consultation",
];

const blank = (service) => ({
  name: "",
  phone: "",
  email: "",
  serviceInterest: service || SERVICE_OPTIONS[0],
  message: "",
  honeypot: "",
  consent: false,
});

// 16px text on mobile stops iOS zooming the page when a field is focused.
const field =
  "w-full rounded-sm border border-forest-700 bg-forest-900/60 px-4 py-3.5 text-base sm:text-sm text-cream-100 placeholder:text-forest-400 outline-none transition-colors duration-200 focus:border-gold-400 focus:bg-forest-900";
const label = "mb-2 block text-[13px] font-semibold uppercase tracking-[0.14em] text-forest-200";

export default function EnquiryForm({ defaultService, onSuccess }) {
  const [form, setForm] = useState(blank(defaultService));
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    if (defaultService) setForm((f) => ({ ...f, serviceInterest: defaultService }));
  }, [defaultService]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setStatus(null);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok) {
        setStatus({ type: "success", msg: json.message || "Thank you! We will get in touch with you shortly." });
        setForm(blank(defaultService));
        if (onSuccess) setTimeout(onSuccess, 3000);
      } else {
        setStatus({ type: "error", msg: json.error || "Unable to send enquiry. Please try again." });
      }
    } catch {
      setStatus({ type: "error", msg: "A connection error occurred. Please call us directly." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      {/* honeypot: real people never see or fill this */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        value={form.honeypot}
        onChange={set("honeypot")}
        className="hidden"
        aria-hidden="true"
      />

      <div>
        <label htmlFor="enq-name" className={label}>Your Name</label>
        <input id="enq-name" required autoComplete="name" value={form.name} onChange={set("name")} placeholder="Full name" className={field} />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="enq-phone" className={label}>Phone</label>
          <input id="enq-phone" required type="tel" inputMode="tel" autoComplete="tel" value={form.phone} onChange={set("phone")} placeholder="+91" className={field} />
        </div>
        <div>
          <label htmlFor="enq-email" className={label}>Email</label>
          <input id="enq-email" required type="email" inputMode="email" autoComplete="email" value={form.email} onChange={set("email")} placeholder="you@email.com" className={field} />
        </div>
      </div>

      <div>
        <label htmlFor="enq-service" className={label}>I&apos;m interested in</label>
        <select id="enq-service" value={form.serviceInterest} onChange={set("serviceInterest")} className={`${field} appearance-none`}>
          {SERVICE_OPTIONS.map((o) => (
            <option key={o} value={o} className="bg-forest-900">
              {o}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="enq-msg" className={label}>Tell us about your day</label>
        <textarea id="enq-msg" rows={4} value={form.message} onChange={set("message")} placeholder="Date, city, guest count, the mood you imagine…" className={`${field} resize-none`} />
      </div>

      <label className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed text-forest-200">
        <input
          type="checkbox"
          required
          checked={form.consent}
          onChange={(e) => setForm((f) => ({ ...f, consent: e.target.checked }))}
          className="mt-1 h-4 w-4 shrink-0 accent-[#cba627]"
        />
        <span>
          I agree to Marrigold Events using my details to respond to my enquiry, as described in the{" "}
          <Link href="/privacy" target="_blank" className="text-gold-300 underline underline-offset-4 hover:text-gold-200">
            Privacy Policy
          </Link>
          .
        </span>
      </label>

      {status && (
        <div
          role="status"
          className={`flex items-start gap-3 rounded-sm border p-4 text-sm ${
            status.type === "success"
              ? "border-gold-500/40 bg-gold-500/10 text-gold-200"
              : "border-terracotta-500/50 bg-terracotta-500/10 text-terracotta-100"
          }`}
        >
          {status.type === "success" ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> : <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />}
          <span>{status.msg}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={busy}
        className="flex w-full items-center justify-center gap-3 rounded-sm bg-gold-500 px-6 py-4 text-sm font-semibold uppercase tracking-[0.14em] text-forest-950 transition-colors duration-200 hover:bg-gold-400 disabled:pointer-events-none disabled:opacity-60"
      >
        {busy ? "Sending…" : "Send Enquiry"}
        <Send className="h-4 w-4" />
      </button>
    </form>
  );
}
