import { NextResponse } from "next/server";
import { getEnquiries, saveEnquiries } from "@/lib/storage.js";
import { Resend } from "resend";

const POLICY_VERSION = "2026-10-29";

// Best-effort per-instance rate limit. On Vercel also add a Firewall rate-limit rule for /api/contact.
const ipSubmissions = new Map();

const esc = (v) =>
  String(v)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const str = (v, max) => (typeof v === "string" ? v.trim().slice(0, max) : "");

export async function POST(req) {
  try {
    const ip =
      req.headers.get("x-real-ip") || req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    const now = Date.now();
    const rateData = ipSubmissions.get(ip) || { count: 0, resetAt: now + 10 * 60 * 1000 };
    if (now > rateData.resetAt) {
      rateData.count = 0;
      rateData.resetAt = now + 10 * 60 * 1000;
    }
    if (rateData.count >= 5) {
      return NextResponse.json(
        { error: "Too many messages sent. Please wait a few minutes before submitting again." },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => ({}));

    // Honeypot: bots fill the hidden field, return fake success
    if (typeof body.honeypot === "string" && body.honeypot.trim()) {
      return NextResponse.json({ success: true, message: "Thank you for reaching out!" });
    }

    const name = str(body.name, 100);
    const phone = str(body.phone, 20);
    const email = str(body.email, 254);
    const message = str(body.message, 2000);
    const serviceInterest = str(body.serviceInterest, 100) || "General Enquiry";

    if (!name || !phone || !email) {
      return NextResponse.json({ error: "Please provide your name, phone number and email." }, { status: 400 });
    }
    if (!/^[0-9+()\-\s]{7,20}$/.test(phone)) {
      return NextResponse.json({ error: "Please enter a valid phone number." }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }
    if (body.consent !== true) {
      return NextResponse.json(
        { error: "Please tick the consent box so we can use your details to reply." },
        { status: 400 }
      );
    }

    rateData.count += 1;
    ipSubmissions.set(ip, rateData);

    const createdAt = new Date().toISOString();
    const newEnquiry = {
      id: `enq-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name,
      phone,
      email,
      message,
      serviceInterest,
      createdAt,
      isRead: false,
      consent: true,
      consentAt: createdAt,
      policyVersion: POLICY_VERSION,
    };

    const allEnquiries = await getEnquiries();
    allEnquiries.push(newEnquiry);
    await saveEnquiries(allEnquiries);

    if (process.env.RESEND_API_KEY) {
      try {
        const resend = new Resend(process.env.RESEND_API_KEY);
        const recipient = process.env.CONTACT_RECEIVER_EMAIL || "parul@marrigoldevents.com";
        const from = process.env.CONTACT_FROM_EMAIL || "Marrigold Events Website <onboarding@resend.dev>";

        await resend.emails.send({
          from,
          to: recipient,
          subject: `New Wedding Enquiry: ${name.replace(/[\r\n]+/g, " ")} (${serviceInterest.replace(/[\r\n]+/g, " ")})`,
          html: `
            <h2>New Wedding Celebration Enquiry</h2>
            <p><strong>Name:</strong> ${esc(name)}</p>
            <p><strong>Phone:</strong> ${esc(phone)}</p>
            <p><strong>Email:</strong> ${esc(email)}</p>
            <p><strong>Service of Interest:</strong> ${esc(serviceInterest)}</p>
            <p><strong>Message:</strong></p>
            <blockquote style="background: #f4f7f4; padding: 12px; border-left: 4px solid #1C3B2B;">
              ${message ? esc(message).replace(/\n/g, "<br>") : "<em>(no message)</em>"}
            </blockquote>
            <p><small>Submitted at ${esc(new Date(createdAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }))} IST. Consent given.</small></p>
          `,
        });
      } catch (mailErr) {
        console.warn("Resend email delivery skipped or failed:", mailErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Thank you! The Marrigold Events team will get in touch with you shortly.",
    });
  } catch (err) {
    console.error("Contact form error:", err);
    return NextResponse.json({ error: "Failed to submit enquiry" }, { status: 500 });
  }
}
