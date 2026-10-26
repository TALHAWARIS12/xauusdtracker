import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SupportWidget } from "@/components/support/SupportWidget";
import { auth } from "@/auth";
import { getSubscriptionStatus } from "@/lib/subscription";

export const metadata: Metadata = {
  title: {
    default: "XAUUSD Tracker | Live Gold Price, Order Flow & Trade Signals",
    template: "%s | XAUUSD Tracker",
  },
  description:
    "Track the live XAU/USD gold price with buyer vs. seller sentiment, market volume, order book depth and automated trade signals in a clean, real-time dashboard.",
};

export const viewport: Viewport = {
  themeColor: "#06080F",
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
      </head>
      <body className="flex min-h-screen flex-col">
        <Header session={session} isPro={isPro} />
        <main className="flex flex-1 flex-col">{children}</main>
        <Footer />
        <SupportWidget />
      </body>
    </html>
  );
}
