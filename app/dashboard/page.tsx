import { Suspense } from "react";
import { auth } from "@/auth";
import { getSubscriptionStatus } from "@/lib/subscription";
import { DashboardClient } from "@/components/dashboard/DashboardClient";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Live Gold Market Dashboard",
  description:
    "Real-time XAU/USD gold price telemetry, buyer vs seller volume ratio, live candlestick charts, order book depth, and automated trade signals.",
};

function DashboardFallback() {
  return (
    <div className="container-app py-8 space-y-6">
      <div className="h-32 rounded-2xl bg-ink-800/40 border border-white/5 animate-pulse" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-96 rounded-2xl bg-ink-800/40 border border-white/5 animate-pulse" />
        <div className="h-96 rounded-2xl bg-ink-800/40 border border-white/5 animate-pulse" />
      </div>
    </div>
  );
}

export default async function DashboardPage() {
  let session = null;
  try {
    session = await auth();
  } catch {}

  // Server-side database subscription check
  const isSubscribed = await getSubscriptionStatus(session?.user?.id);

  return (
    <Suspense fallback={<DashboardFallback />}>
      <DashboardClient
        initialSubscribed={isSubscribed}
        userEmail={session?.user?.email}
      />
    </Suspense>
  );
}
