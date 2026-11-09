import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyIntaSendWebhookChallenge } from "@/lib/intasend";
import { activateSuccessfulPayment } from "@/lib/payment-activation";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    let payload: any;

    try {
      payload = JSON.parse(rawBody);
    } catch {
      return new Response("Malformed JSON payload", { status: 400 });
    }

    // 1. Verify Challenge if configured in environment
    if (payload.challenge !== undefined && process.env.INTASEND_CHALLENGE) {
      const isValid = verifyIntaSendWebhookChallenge(payload.challenge);
      if (!isValid) {
        console.warn("IntaSend webhook rejected: Invalid challenge token.");
        return new Response("Unauthorized: Invalid webhook challenge", { status: 401 });
      }
    }

    const { invoice_id, state, api_ref, checkout_id, checkoutId } = payload;
    const resolvedCheckoutId = checkout_id || checkoutId;

    // 2. Acknowledge and skip non-completed state updates
    if (state !== "COMPLETE") {
      if (state === "FAILED" || state === "CANCELED") {
        const failedConditions: any[] = [];
        if (api_ref) {
          failedConditions.push({ id: String(api_ref) });
          failedConditions.push({ providerReference: String(api_ref) });
        }
        if (resolvedCheckoutId) {
          failedConditions.push({ providerReference: String(resolvedCheckoutId) });
        }
        if (invoice_id) {
          failedConditions.push({ providerReference: String(invoice_id) });
        }

        if (failedConditions.length > 0) {
          await prisma.payment.updateMany({
            where: {
              OR: failedConditions,
              status: "PENDING",
            },
            data: { status: "FAILED" },
          }).catch(() => null);
        }
      }
      return NextResponse.json({ received: true, state }, { status: 200 });
    }

    // 3. Find the payment record by api_ref (payment.id), checkout_id, or invoice_id
    const searchConditions: any[] = [];
    if (api_ref) {
      searchConditions.push({ id: String(api_ref) });
      searchConditions.push({ providerReference: String(api_ref) });
    }
    if (resolvedCheckoutId) {
      searchConditions.push({ providerReference: String(resolvedCheckoutId) });
    }
    if (invoice_id) {
      searchConditions.push({ providerReference: String(invoice_id) });
    }

    if (searchConditions.length === 0) {
      return NextResponse.json({ error: "Missing api_ref, checkout_id, or invoice_id in payload." }, { status: 400 });
    }

    const transaction = await prisma.payment.findFirst({
      where: {
        OR: searchConditions,
      },
    });

    if (!transaction) {
      console.error(`IntaSend webhook: Payment record not found for api_ref: '${api_ref}', invoice_id: '${invoice_id}'`);
      return NextResponse.json({ error: "Payment record not found" }, { status: 404 });
    }

    // 4. Activate subscription and credit referrals (idempotent)
    const result = await activateSuccessfulPayment(
      transaction.id,
      invoice_id || resolvedCheckoutId || api_ref
    );

    return NextResponse.json(
      { success: true, message: "Payment processed successfully.", result },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("IntaSend webhook processing error:", error);
    return NextResponse.json(
      { error: "Internal server error processing IntaSend webhook." },
      { status: 500 }
    );
  }
}
