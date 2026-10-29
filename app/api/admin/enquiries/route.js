import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth.js";
import { getEnquiries, saveEnquiries } from "@/lib/storage.js";

export async function GET() {
  try {
    const authed = await isAuthenticated();
    if (!authed) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const enquiries = await getEnquiries();
    // Sort newest first
    enquiries.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return NextResponse.json({ enquiries });
  } catch (err) {
    console.error("Failed to load enquiries:", err);
    return NextResponse.json({ error: "Failed to load enquiries" }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const authed = await isAuthenticated();
    if (!authed) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Enquiry ID is required" }, { status: 400 });
    }

    const enquiries = await getEnquiries();
    const filtered = enquiries.filter((e) => e.id !== id);
    await saveEnquiries(filtered);

    return NextResponse.json({ success: true, message: "Enquiry deleted successfully" });
  } catch (err) {
    console.error("Failed to delete enquiry:", err);
    return NextResponse.json({ error: "Failed to delete enquiry" }, { status: 500 });
  }
}

