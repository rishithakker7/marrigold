import { NextResponse } from "next/server";
import { checkRateLimit, recordFailedAttempt, resetAttempts, verifyAdminPassword, createAdminSession } from "@/lib/auth.js";

export async function POST(req) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";
    const rateCheck = checkRateLimit(ip);

    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          error: `Too many failed login attempts. Account locked. Please wait ${rateCheck.waitSeconds} seconds.`,
        },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { password } = body;

    if (!password || typeof password !== "string") {
      return NextResponse.json({ error: "Password is required" }, { status: 400 });
    }

    const isValid = await verifyAdminPassword(password);

    if (!isValid) {
      recordFailedAttempt(ip);
      return NextResponse.json(
        { error: "Invalid credentials. Please verify and try again." },
        { status: 401 }
      );
    }

    resetAttempts(ip);
    await createAdminSession();

    return NextResponse.json({ success: true, message: "Authentication successful" });
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json(
      { error: err?.message || "Server error occurred" },
      { status: 500 }
    );
  }
}

