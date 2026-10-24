import { Metadata } from "next";
import { PaymentStatusClient } from "@/components/payment/PaymentStatusClient";

export const metadata: Metadata = {
  title: "Payment Status | XAUUSD Intelligence",
  description: "Real-time payment confirmation and crypto subscription status tracking.",
};

interface PaymentStatusPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function PaymentStatusPage({
  searchParams,
}: PaymentStatusPageProps) {
  const params = await searchParams;
  const orderId =
    typeof params.order_id === "string"
      ? params.order_id
      : typeof params.orderId === "string"
      ? params.orderId
      : null;

  const status = typeof params.status === "string" ? params.status : null;

  return (
    <main className="min-h-[80vh] flex items-center justify-center">
      <PaymentStatusClient initialOrderId={orderId} urlStatus={status} />
    </main>
  );
}
