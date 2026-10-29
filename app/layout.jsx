import "./globals.css";
import { Fraunces, DM_Sans } from "next/font/google";
import SiteShell from "@/components/SiteShell";

// Headings: Fraunces (sturdy, readable serif with real character). Body: DM Sans at normal weight.
const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap",
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "https://www.marrigoldevents.com");

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Marrigold Events | Luxury Wedding Planning & Decor Atelier",
    template: "%s | Marrigold Events",
  },
  description:
    "Marrigold Events is Mumbai's premier bespoke wedding planning, in-house DIY decor artistry, and destination wedding atelier based in Mulund West.",
  keywords: [
    "Marrigold Events",
    "Wedding Planner Mumbai",
    "Mulund West Wedding Decor",
    "Destination Wedding India",
    "Bespoke Mandap Decor",
    "In-house DIY Decor Art",
  ],
  icons: {
    icon: [
      { url: "/icon.png", type: "image/png" },
      { url: "/favicon.ico" },
    ],
    apple: "/apple-icon.png",
  },
  openGraph: {
    title: "Marrigold Events | Luxury Wedding Planning & Decor Atelier",
    description:
      "Marrigold Events is Mumbai's premier bespoke wedding planning, in-house DIY decor artistry, and destination wedding atelier based in Mulund West.",
    url: siteUrl,
    siteName: "Marrigold Events",
    images: [
      {
        url: "/images/Chat-Logo.png",
        width: 1882,
        height: 836,
        alt: "Marrigold Events",
      },
    ],
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    images: ["/images/Chat-Logo.png"],
  },
};

export const viewport = {
  themeColor: "#0F241A",
  width: "device-width",
  initialScale: 1,
};

// Local-business structured data helps Google show the studio in local searches.
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  name: "Marrigold Events",
  description:
    "Bespoke wedding planning, in-house decor artistry and destination wedding curation in Mulund West, Mumbai.",
  url: siteUrl,
  image: `${siteUrl}/images/Chat-Logo.png`,
  telephone: "+919326787480",
  email: "parul@marrigoldevents.com",
  address: {
    "@type": "PostalAddress",
    streetAddress: "2402, Marathon Monte Vista, M.M. Marg, opp. Telephone Exchange, Mulund West",
    addressLocality: "Mumbai",
    addressRegion: "Maharashtra",
    postalCode: "400080",
    addressCountry: "IN",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${dmSans.variable}`}>
      <body className="antialiased bg-cream-50 text-forest-950 min-h-screen flex flex-col selection:bg-gold-500 selection:text-forest-950">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  );
}
