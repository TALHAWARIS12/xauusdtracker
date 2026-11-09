import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyIntaSendWebhookChallenge, verifyIntaSendPayment } from "@/lib/intasend";
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

    // 1. Verify Challenge if configured
    if (payload.challenge !== undefined) {
      const isValid = verifyIntaSendWebhookChallenge(payload.challenge);
      if (!isValid) {
        console.warn("IntaSend webhook rejected: Invalid challenge.");
        return new Response("Unauthorized: Invalid webhook challenge", { status: 401 });
      }
    }

    const { invoice_id, state, api_ref, provider, value } = payload;

    // 2. Acknowledge and skip non-completed state updates
    if (state !== "COMPLETE") {
      if (state === "FAILED" || state === "CANCELED") {
        if (api_ref) {
          await prisma.payment.updateMany({
            where: {
              OR: [{ id: api_ref }, { providerReference: api_ref }],
              status: "PENDING",
            },
            data: { status: "FAILED" },
          }).catch(() => null);
        }
      }
      return NextResponse.json({ received: true, state }, { status: 200 });
    }

    // 3. Optional double verification with IntaSend status endpoint
    if (invoice_id && process.env.INTASEND_SECRET_KEY) {
      try {
        const verified = await verifyIntaSendPayment({ invoice_id });
        if (verified?.state && verified.state !== "COMPLETE") {
          console.warn(`IntaSend webhook: Transaction ${invoice_id} verify returned '${verified.state}'.`);
          return NextResponse.json({ received: true, skipped: "not_verified_complete" }, { status: 200 });
        }
      } catch (verifyError) {
        console.warn("IntaSend secondary verification lookup warning:", verifyError);
        // Continue processing if the payload itself is authenticated
      }
    }

    // 4. Find the payment record by api_ref (payment.id) or invoice_id
    const searchConditions: any[] = [];
    if (api_ref) {
      searchConditions.push({ id: String(api_ref) });
      searchConditions.push({ providerReference: String(api_ref) });
    }
    if (invoice_id) {
      searchConditions.push({ providerReference: String(invoice_id) });
    }

    if (searchConditions.length === 0) {
      return NextResponse.json({ error: "Missing api_ref or invoice_id in payload." }, { status: 400 });
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

    // 5. Activate subscription and credit referrals (idempotent)
    const result = await activateSuccessfulPayment(transaction.id, invoice_id || api_ref);

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
