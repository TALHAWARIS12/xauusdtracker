import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SupportWidget } from "@/components/support/SupportWidget";
import { VisitorTracker } from "@/components/analytics/VisitorTracker";
import { auth } from "@/auth";
import { getSubscriptionStatus } from "@/lib/subscription";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://xauusdtracker.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "XAUUSD Tracker | Live Gold Price, Order Flow & Trade Signals",
    template: "%s | XAUUSD Tracker",
  },
  description:
    "Track the live XAU/USD gold price with buyer vs. seller sentiment, market volume, institutional liquidation pools, and automated trade signals in a real-time dashboard.",
  keywords: [
    "XAUUSD Tracker",
    "xauusdtracker.com",
    "XAUUSD live price",
    "gold price tracker",
    "XAUUSD signals",
    "gold order flow",
    "XAUUSD liquidation pools",
    "forex gold trading",
    "live gold chart",
  ],
  applicationName: "XAUUSD Tracker",
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "XAUUSD Tracker",
    title: "XAUUSD Tracker | Live Gold Price, Order Flow & Trade Signals",
    description:
      "Real-time institutional XAU/USD gold price tracking, buyer vs. seller order flow, liquidity pools, and high-probability trade setups.",
  },
  twitter: {
    card: "summary_large_image",
    title: "XAUUSD Tracker | Live Gold Price, Order Flow & Trade Signals",
    description:
      "Real-time institutional XAU/USD gold price tracking, buyer vs. seller order flow, liquidity pools, and high-probability trade setups.",
  },
};

export const viewport: Viewport = {
  themeColor: "#06080F",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "XAUUSD Tracker",
  alternateName: ["XAUUSDTracker", "XAU/USD Gold Tracker"],
  url: siteUrl,
  description:
    "Track the live XAU/USD gold price with buyer vs. seller sentiment, market volume, order book depth and automated trade signals.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let session = null;
  try {
    session = await auth();
  } catch {}

  const isPro = await getSubscriptionStatus(session?.user?.id);

  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="flex min-h-screen flex-col">
        <Header session={session} isPro={isPro} />
        <main className="flex flex-1 flex-col">{children}</main>
        <Footer />
        <SupportWidget />
        <VisitorTracker />
      </body>
    </html>
  );
}
