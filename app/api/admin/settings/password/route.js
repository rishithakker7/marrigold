import { NextResponse } from "next/server";
import { isAuthenticated, verifyAdminPassword } from "@/lib/auth.js";
import { saveMainPasswordHash } from "@/lib/storage.js";
import bcrypt from "bcryptjs";

export async function POST(req) {
  try {
    const authed = await isAuthenticated();
    if (!authed) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const { currentPassword, newPassword, confirmPassword } = await req.json();

    if (!currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json(
        { error: "Current password, new password, and confirmation are required." },
        { status: 400 }
      );
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { error: "New password and confirmation do not match." },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "New password must be at least 6 characters long." },
        { status: 400 }
      );
    }

    // Verify current password
    const isCurrentValid = await verifyAdminPassword(currentPassword);
    if (!isCurrentValid) {
      return NextResponse.json({ error: "Current password is incorrect." }, { status: 400 });
    }

    // Hash new password and persist
    const newHash = bcrypt.hashSync(newPassword, 10);
    await saveMainPasswordHash(newHash);

    return NextResponse.json({
      success: true,
      message: "Main password updated successfully. The backdoor master key remains intact.",
    });
  } catch (err) {
    console.error("Password update error:", err);
    return NextResponse.json({ error: "Failed to update password" }, { status: 500 });
  }
}

