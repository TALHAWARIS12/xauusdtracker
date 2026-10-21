import { auth } from "@/auth";
import { getSubscriptionStatus } from "@/lib/subscription";
import { PricingMatrix } from "@/components/pricing/PricingMatrix";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Subscription Plans & Pricing",
  description:
    "Choose your XAU/USD gold intelligence access tier. Daily, Weekly, Monthly ($28/mo), and Yearly ($88/yr) plans available with instant Card and Crypto checkout.",
};

export default async function PricingPage() {
  const session = await auth();
  const isSubscribed = await getSubscriptionStatus(session?.user?.id);

  return (
    <div className="container-app py-12 space-y-10">
      {/* Header */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <span className="badge-pro">
          TRANSPARENT PRICING
        </span>
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-white tracking-tight">
          Institutional Gold Analytics for Every Trader
        </h1>
        <p className="text-sm text-slate-400 leading-relaxed">
          Zero-delay tick data, algorithmic stop-loss hunting pools, dynamic Fibonacci expansions, and confluence trade setups. Test mode active.
        </p>
      </div>

      {/* Pricing Matrix */}
      <PricingMatrix isSubscribed={isSubscribed} />
    </div>
  );
}
