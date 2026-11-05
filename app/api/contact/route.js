import { NextResponse } from "next/server";
import { Resend } from "resend";

const POLICY_VERSION = "2026-10-29";
const ipSubmissions = new Map();

const esc = (value) =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const str = (value, max) => (typeof value === "string" ? value.trim().slice(0, max) : "");
const errorMessage = "Something went wrong, please WhatsApp us.";

export async function POST(req) {
  try {
    const ip =
      req.headers.get("x-real-ip") ||
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      "127.0.0.1";
    const now = Date.now();
    const rateData = ipSubmissions.get(ip) || { count: 0, resetAt: now + 10 * 60 * 1000 };
    if (now > rateData.resetAt) {
      rateData.count = 0;
      rateData.resetAt = now + 10 * 60 * 1000;
    }
    if (rateData.count >= 5) {
      return NextResponse.json({ error: "Too many messages sent. Please wait a few minutes before trying again." }, { status: 429 });
    }

    const body = await req.json().catch(() => ({}));
    if (typeof body.honeypot === "string" && body.honeypot.trim()) {
      return NextResponse.json({ success: true, message: "Thank you for reaching out!" });
    }

    const name = str(body.name, 100);
    const phone = str(body.phone, 20);
    const email = str(body.email, 254);
    const message = str(body.message, 2000);
    const serviceInterest = str(body.serviceInterest, 100) || "General Enquiry";

    if (!name || !phone || !email || body.consent !== true) {
      return NextResponse.json({ error: "Please complete the required fields and consent." }, { status: 400 });
    }
    if (!/^[0-9+()\-\s]{7,20}$/.test(phone) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Please enter valid contact details." }, { status: 400 });
    }
    if (!process.env.RESEND_API_KEY || !process.env.CONTACT_FROM_EMAIL || !process.env.CONTACT_RECEIVER_EMAIL) {
      console.error("Contact email is not configured.");
      return NextResponse.json({ error: errorMessage }, { status: 500 });
    }

    rateData.count += 1;
    ipSubmissions.set(ip, rateData);
    const createdAt = new Date().toISOString();
    const resend = new Resend(process.env.RESEND_API_KEY);

    const { error } = await resend.emails.send({
      from: process.env.CONTACT_FROM_EMAIL,
      to: process.env.CONTACT_RECEIVER_EMAIL,
      subject: `New Wedding Enquiry: ${name.replace(/[\r\n]+/g, " ")} (${serviceInterest.replace(/[\r\n]+/g, " ")})`,
      html: `
        <h2>New Wedding Celebration Enquiry</h2>
        <p><strong>Name:</strong> ${esc(name)}</p>
        <p><strong>Phone:</strong> ${esc(phone)}</p>
        <p><strong>Email:</strong> ${esc(email)}</p>
        <p><strong>Service of Interest:</strong> ${esc(serviceInterest)}</p>
        <p><strong>Message:</strong></p>
        <blockquote>${message ? esc(message).replace(/\n/g, "<br>") : "<em>(no message)</em>"}</blockquote>
        <p><small>Submitted at ${esc(new Date(createdAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }))} IST. Consent given.</small></p>
        <p><small>Policy version: ${POLICY_VERSION}</small></p>
      `,
    });
    if (error) throw new Error(error.message || "Resend rejected the email.");

    return NextResponse.json({
      success: true,
      message: "Thank you! The Marrigold Events team will get in touch with you shortly.",
    });
  } catch (err) {
    console.error("Contact email error:", err);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
