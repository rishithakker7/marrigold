import { NextResponse } from "next/server";
import { clearAdminSession } from "@/lib/auth.js";

export async function POST() {
  await clearAdminSession();
  return NextResponse.json({ success: true });
}

