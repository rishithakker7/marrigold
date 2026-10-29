import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth.js";
import { uploadMediaFile } from "@/lib/storage.js";

export async function POST(req) {
  try {
    const authed = await isAuthenticated();
    if (!authed) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file");

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Validate mime type
    const validMimes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
      "video/mp4",
      "video/webm",
      "video/quicktime",
    ];

    if (!validMimes.includes(file.type)) {
      return NextResponse.json(
        {
          error:
            "Invalid file format. Supported formats: JPG, PNG, WebP, GIF, MP4, WebM, QuickTime (MOV).",
        },
        { status: 400 }
      );
    }

    // Vercel functions reject request bodies over ~4.5 MB, so stop early with a clear message.
    const MAX_BYTES = 4 * 1024 * 1024;
    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: "File is too large. Please upload a file under 4 MB (compress the image first)." },
        { status: 413 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const url = await uploadMediaFile(buffer, file.name, file.type);

    return NextResponse.json({
      success: true,
      url,
      type: file.type.startsWith("video/") ? "video" : "image",
      name: file.name,
    });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json({ error: "Failed to upload file" }, { status: 500 });
  }
}

