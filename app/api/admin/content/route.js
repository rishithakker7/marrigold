import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth.js";
import { getSiteData, saveSiteData } from "@/lib/storage.js";

export async function GET() {
  try {
    const data = await getSiteData();
    return NextResponse.json(data);
  } catch (err) {
    console.error("Failed to load content:", err);
    return NextResponse.json({ error: "Failed to load content" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const authed = await isAuthenticated();
    if (!authed) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const body = await req.json();
    await saveSiteData(body);

    return NextResponse.json({ success: true, message: "Content updated successfully" });
  } catch (err) {
    console.error("Failed to update content:", err);
    return NextResponse.json({ error: err?.message || "Failed to update content" }, { status: 500 });
  }
}

