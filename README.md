# Marrigold Events — Modern Luxury Website

Modern, fast, mobile-first website for Marrigold Events, built with Next.js 15 App Router and Tailwind CSS. All site content is maintained in `lib/data.js`; the contact form sends enquiries through Resend without application-side storage.

## Quick Start

```bash
npm install
npm run dev
```

For a production build:

```bash
npm run build
npm run start
```

## Environment Variables

```env
RESEND_API_KEY=""
CONTACT_FROM_EMAIL="Marrigold Events <hello@marrigoldevents.com>"
NEXT_PUBLIC_SITE_URL="https://www.marrigoldevents.com"
```

All contact and enquiry form emails are sent to `parul@marrigoldevents.com`. The sender domain must be verified in Resend. If email delivery fails, the contact form returns an error and asks visitors to contact Marrigold Events through WhatsApp.

## Content

Edit `lib/data.js` to update hero slides, services, gallery entries, founder content, contact information, and other site data.

## Deployment

The project is configured for Cloudflare Workers through OpenNext. It does not use a writable filesystem, Vercel Blob, or a CMS/admin backend.

