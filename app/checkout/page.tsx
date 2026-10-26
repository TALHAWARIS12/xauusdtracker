import { auth } from "@/auth";
import { getUserSubscription } from "@/lib/subscription";
import { CheckoutClient } from "@/components/checkout/CheckoutClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Crypto Checkout | NOWPayments",
  description: "Subscribe to XAUUSD Tracker using Cryptocurrency powered by NOWPayments gateway.",
};

interface CheckoutPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function CheckoutPage({ searchParams }: CheckoutPageProps) {
  const session = await auth();
  const subInfo = await getUserSubscription(session?.user?.id);
  const params = await searchParams;
  const planParam = typeof params.plan === "string" ? params.plan : "monthly";

  return (
    <CheckoutClient
      initialPlanId={planParam}
      userEmail={session?.user?.email}
      currentPlanId={subInfo.planId}
      isSubscribed={subInfo.isSubscribed}
    />
  );
}
