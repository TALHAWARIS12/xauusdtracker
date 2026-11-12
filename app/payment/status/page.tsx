import { Metadata } from "next";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { PaymentStatusClient } from "@/components/payment/PaymentStatusClient";

export const metadata: Metadata = {
  title: "Payment Status | XAUUSD Intelligence",
  description: "Real-time payment confirmation and subscription clearance tracking.",
};

interface PaymentStatusPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function PaymentStatusPage({
  searchParams,
}: PaymentStatusPageProps) {
  const params = await searchParams;

  // Extract all possible order/tracking identifiers from various gateways
  const rawOrderId =
    typeof params.order_id === "string"
      ? params.order_id
      : typeof params.orderId === "string"
      ? params.orderId
      : typeof params.checkout_id === "string"
      ? params.checkout_id
      : typeof params.checkoutId === "string"
      ? params.checkoutId
      : typeof params.api_ref === "string"
      ? params.api_ref
      : typeof params.tracking_id === "string"
      ? params.tracking_id
      : typeof params.id === "string"
      ? params.id
      : null;

  const invoiceId =
    typeof params.invoice_id === "string"
      ? params.invoice_id
      : typeof params.invoiceId === "string"
      ? params.invoiceId
      : null;

  const status = typeof params.status === "string" ? params.status : null;

  let resolvedOrderId = rawOrderId;
  let resolvedProvider =
    typeof params.provider === "string"
      ? params.provider
      : params.checkout_id || params.checkoutId || params.api_ref || params.tracking_id || invoiceId
      ? "intasend"
      : null;

  // If no order ID was provided in URL query, find the current logged-in user's latest payment
  if (!resolvedOrderId) {
    try {
      const session = await auth();
      if (session?.user?.id) {
        const latestPayment = await prisma.payment.findFirst({
          where: { userId: session.user.id },
          orderBy: { createdAt: "desc" },
        });
        if (latestPayment) {
          resolvedOrderId = latestPayment.id;
          resolvedProvider = latestPayment.provider.toLowerCase();
        }
      }
    } catch (sessionErr) {
      console.warn("Failed to resolve payment via session fallback:", sessionErr);
    }
  }

  return (
    <main className="min-h-[80vh] flex items-center justify-center">
      <PaymentStatusClient
        initialOrderId={resolvedOrderId}
        urlStatus={status}
        initialInvoiceId={invoiceId}
        initialProvider={resolvedProvider}
      />
    </main>
  );
}
