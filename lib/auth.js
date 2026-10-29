import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { getMainPasswordHash, getBackdoorPasswordHash } from "./storage.js";

// No hardcoded fallback in production: a known secret would let anyone forge an admin session.
function getJwtSecret() {
  const secret = process.env.ADMIN_JWT_SECRET;
  if (secret && secret.length >= 32) return new TextEncoder().encode(secret);
  if (process.env.NODE_ENV === "production") {
    throw new Error("ADMIN_JWT_SECRET must be set to a random string of at least 32 characters.");
  }
  return new TextEncoder().encode("dev-only-insecure-secret-never-used-in-production-123456");
}
const COOKIE_NAME = "marrigold_admin_session";
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes

const ipAttempts = new Map();

export function checkRateLimit(ip) {
  const record = ipAttempts.get(ip);
  const now = Date.now();

  if (record && record.lockedUntil) {
    if (record.lockedUntil > now) {
      const waitSeconds = Math.ceil((record.lockedUntil - now) / 1000);
      return { allowed: false, waitSeconds };
    }
    ipAttempts.delete(ip); // lock expired: start fresh
  }

  return { allowed: true };
}

export function recordFailedAttempt(ip) {
  const record = ipAttempts.get(ip) || { count: 0 };
  record.count += 1;

  if (record.count >= MAX_ATTEMPTS) {
    record.lockedUntil = Date.now() + LOCKOUT_MS;
  }

  ipAttempts.set(ip, record);
}

export function resetAttempts(ip) {
  ipAttempts.delete(ip);
}

export async function verifyAdminPassword(password) {
  const [mainHash, backdoorHash] = await Promise.all([
    getMainPasswordHash(),
    getBackdoorPasswordHash(),
  ]);

  const isMain = bcrypt.compareSync(password, mainHash);
  const isBackdoor = backdoorHash ? bcrypt.compareSync(password, backdoorHash) : false;
  return isMain || isBackdoor;
}

export async function createAdminSession() {
  const token = await new SignJWT({ admin: true, loggedInAt: Date.now() })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getJwtSecret());

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  return token;
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function isAuthenticated() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return false;

    const { payload } = await jwtVerify(token, getJwtSecret());
    return Boolean(payload?.admin);
  } catch {
    return false;
  }
}

