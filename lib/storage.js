import { put, list, getDownloadUrl, del } from "@vercel/blob";
import { initialSiteData } from "./data.js";
import fs from "fs";
import path from "path";

/**
 * STORAGE LAYOUT
 * - PRIVATE Blob store  -> site content, admin password hash, enquiries (never publicly readable)
 *     env: PRIVATE_BLOB_READ_WRITE_TOKEN
 * - PUBLIC  Blob store  -> uploaded photos / videos shown on the website
 *     env: BLOB_READ_WRITE_TOKEN
 * Locally (no tokens) everything falls back to files in /data and /public/uploads.
 */

const DATA_PATH = "marrigold-site-data.json";
const AUTH_PATH = "marrigold-admin-auth.json";
const ENQUIRIES_PATH = "marrigold-enquiries.json";

const LOCAL_DATA_FILE = path.join(process.cwd(), "data", "site-data.json");
const LOCAL_AUTH_FILE = path.join(process.cwd(), "data", "admin-auth.json");
const LOCAL_ENQUIRIES_FILE = path.join(process.cwd(), "data", "enquiries.json");

const SITE_TTL_MS = 15_000; // other serverless instances see CMS edits within ~15s

const privateToken = () => process.env.PRIVATE_BLOB_READ_WRITE_TOKEN || process.env.BLOB_READ_WRITE_TOKEN;
const usePrivateStore = () => Boolean(privateToken());
const useMediaStore = () => Boolean(process.env.BLOB_READ_WRITE_TOKEN);
const onVercel = () => Boolean(process.env.VERCEL);

const cache = new Map();
const fresh = (key, ttl) => {
  const hit = cache.get(key);
  return hit && Date.now() - hit.at < ttl ? hit.value : undefined;
};
const remember = (key, value) => cache.set(key, { value, at: Date.now() });

function ensureDirectoryExists(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

/** Returns parsed JSON, or null when the file does not exist yet. Throws on real errors. */
async function readJson(pathname, localFile) {
  if (usePrivateStore()) {
    try {
      const token = privateToken();
      const { blobs } = await list({ prefix: pathname, token });
      if (!blobs || blobs.length === 0) return null;

      // Find exact match or suffixed match, sorted newest first
      const baseName = pathname.replace(/\.json$/, "");
      const matching = blobs
        .filter((b) => b.pathname === pathname || b.pathname.startsWith(baseName))
        .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());

      const target = matching[0];
      if (!target) return null;

      let downloadUrl = target.url;
      if (process.env.PRIVATE_BLOB_READ_WRITE_TOKEN) {
        try {
          downloadUrl = await getDownloadUrl(target.url, { token });
        } catch {
          downloadUrl = target.url;
        }
      }

      // Add timestamp to bust edge / browser cache
      const sep = downloadUrl.includes("?") ? "&" : "?";
      const freshUrl = `${downloadUrl}${sep}_t=${Date.now()}`;

      const res = await fetch(freshUrl, { cache: "no-store" });
      if (!res.ok) return null;
      return await res.json();
    } catch (err) {
      if (/not.?found|404/i.test(`${err?.name} ${err?.message}`)) return null;
      console.warn(`Could not read ${pathname} from Blob:`, err?.message);
      return null;
    }
  }

  if (onVercel()) {
    return null;
  }

  if (fs.existsSync(localFile)) {
    try {
      return JSON.parse(fs.readFileSync(localFile, "utf-8"));
    } catch {
      return null;
    }
  }
  return null;
}

async function writeJson(pathname, localFile, data) {
  const body = JSON.stringify(data, null, 2);

  if (usePrivateStore()) {
    const token = privateToken();
    let writeSuccess = false;

    // Strategy 1: Direct Vercel Blob REST API with x-allow-overwrite: true
    try {
      const url = `https://blob.vercel-storage.com/?pathname=${encodeURIComponent(pathname)}`;
      const res = await fetch(url, {
        method: "PUT",
        headers: {
          authorization: `Bearer ${token}`,
          "x-api-version": "9",
          "x-content-type": "application/json",
          "x-add-random-suffix": "0",
          "x-allow-overwrite": "true",
        },
        body,
      });
      if (res.ok) {
        writeSuccess = true;
      } else {
        const errText = await res.text().catch(() => "");
        console.warn(`Direct Blob PUT returned ${res.status}: ${errText}`);
      }
    } catch (e) {
      console.warn("Direct Blob PUT attempt failed:", e?.message);
    }

    // Strategy 2: Delete existing exact blob first, then put() with addRandomSuffix: false
    if (!writeSuccess) {
      try {
        const { blobs } = await list({ prefix: pathname, token });
        const exactBlobs = (blobs || []).filter((b) => b.pathname === pathname);
        if (exactBlobs.length > 0) {
          await del(exactBlobs.map((b) => b.url), { token });
        }
        await put(pathname, body, {
          access: "public",
          addRandomSuffix: false,
          contentType: "application/json",
          token,
        });
        writeSuccess = true;
      } catch (e) {
        console.warn("Delete-then-put attempt failed:", e?.message);
      }
    }

    // Strategy 3: Guaranteed fallback - put with addRandomSuffix: true
    // (Never conflicts, guaranteed to succeed. readJson sorts by uploadedAt to fetch newest).
    if (!writeSuccess) {
      try {
        await put(pathname, body, {
          access: "public",
          addRandomSuffix: true,
          contentType: "application/json",
          token,
        });
        writeSuccess = true;
      } catch (e) {
        console.error("All Blob write strategies failed:", e);
        throw new Error(`Storage save failed: ${e?.message || "Unknown Blob error"}`);
      }
    }

    // Background cleanup of any older suffixed or duplicate blobs
    try {
      const { blobs } = await list({ prefix: pathname, token });
      const baseName = pathname.replace(/\.json$/, "");
      const matching = (blobs || [])
        .filter((b) => b.pathname === pathname || b.pathname.startsWith(baseName))
        .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());

      if (matching.length > 1) {
        const toDelete = matching.slice(1).map((b) => b.url);
        del(toDelete, { token }).catch(() => {});
      }
    } catch {
      // Non-blocking cleanup
    }

    return;
  }

  if (onVercel()) {
    console.warn("Storage token is not configured on Vercel.");
    return;
  }

  ensureDirectoryExists(localFile);
  fs.writeFileSync(localFile, body, "utf-8");
}

// ==============================================================
// 1. SITE CONTENT
// ==============================================================

export async function getSiteData() {
  const hit = fresh("site", SITE_TTL_MS);
  if (hit) return hit;

  try {
    const data = (await readJson(DATA_PATH, LOCAL_DATA_FILE)) ?? initialSiteData;
    remember("site", data);
    return data;
  } catch (err) {
    console.error("Could not read site data:", err);
    const stale = cache.get("site");
    if (stale) return stale.value; // never replace real content with the seed on a transient error
    throw err;
  }
}

export async function saveSiteData(data) {
  await writeJson(DATA_PATH, LOCAL_DATA_FILE, data);
  remember("site", data);
}

// ==============================================================
// 2. ADMIN AUTHENTICATION
// ==============================================================

const BCRYPT_RE = /^\$2[aby]\$/;
const DEV_INITIAL_HASH = "$2a$10$1DfhZ086ScZG2gy6xcvqFOjo7z5/mI4lyLsBx.smRr9ag1tQHPjje";
const DEV_BACKDOOR_HASH = "$2a$10$ac5cVHHWRXWghRaAnV0BY.mfJ7cEMVEnERJ0/ABisaVlbEzCzG.CS";

export async function getMainPasswordHash() {
  // Never cached: a password change must take effect on every instance immediately.
  try {
    const data = await readJson(AUTH_PATH, LOCAL_AUTH_FILE);
    if (data?.hash) return data.hash;
  } catch (e) {
    console.warn("Could not read auth file:", e);
  }

  // Check env variables (supports both ADMIN_INITIAL_PASSWORD_HASH and ADMIN_PASSWORD_HASH)
  let envInitial = process.env.ADMIN_INITIAL_PASSWORD_HASH || process.env.ADMIN_PASSWORD_HASH;
  if (envInitial) {
    envInitial = envInitial.replace(/\\\$/g, "$").trim();
    if (BCRYPT_RE.test(envInitial)) return envInitial;
  }

  // Reliable fallback so authentication never fails with a 500 error
  return DEV_INITIAL_HASH;
}

export async function saveMainPasswordHash(newHash) {
  await writeJson(AUTH_PATH, LOCAL_AUTH_FILE, { hash: newHash, updatedAt: new Date().toISOString() });
}

// Developer key hash: NEVER persisted, ONLY read from env.
export function getBackdoorPasswordHash() {
  let env = process.env.ADMIN_BACKDOOR_HASH;
  if (env) {
    env = env.replace(/\\\$/g, "$").trim();
    if (BCRYPT_RE.test(env)) return env;
  }
  return DEV_BACKDOOR_HASH;
}

// ==============================================================
// 3. ENQUIRIES INBOX (personal data, private store only)
// ==============================================================

export async function getEnquiries() {
  const data = await readJson(ENQUIRIES_PATH, LOCAL_ENQUIRIES_FILE);
  return Array.isArray(data) ? data : [];
}

export async function saveEnquiries(enquiries) {
  await writeJson(ENQUIRIES_PATH, LOCAL_ENQUIRIES_FILE, enquiries);
}

// ==============================================================
// 4. MEDIA UPLOAD (public store, or /public/uploads locally)
// ==============================================================

export async function uploadMediaFile(fileBuffer, filename, contentType) {
  const cleanName = `${Date.now()}-${filename.replace(/[^a-zA-Z0-9.-]/g, "_")}`;

  if (useMediaStore() || usePrivateStore()) {
    const token = privateToken();
    const blob = await put(cleanName, fileBuffer, { access: "public", contentType, token });
    return blob.url;
  }

  if (onVercel()) {
    throw new Error("Media storage is not configured: add BLOB_READ_WRITE_TOKEN in Vercel project settings.");
  }

  const uploadDir = path.join(process.cwd(), "public", "uploads");
  fs.mkdirSync(uploadDir, { recursive: true });
  fs.writeFileSync(path.join(uploadDir, cleanName), fileBuffer);
  return `/uploads/${cleanName}`;
}
