import { auth } from "@/auth";
import { CheckoutClient } from "@/components/checkout/CheckoutClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sandbox Checkout | Cards & Crypto",
  description: "Test checkout mode for XAUUSD Tracker. Test card payments with Stripe test numbers or simulate cryptocurrency payments.",
};

interface CheckoutPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function CheckoutPage({ searchParams }: CheckoutPageProps) {
  const session = await auth();
  const params = await searchParams;
  const planParam = typeof params.plan === "string" ? params.plan : "monthly";

  return (
    <CheckoutClient
      initialPlanId={planParam}
      userEmail={session?.user?.email}
    />
  );
}
