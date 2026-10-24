import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyIpnSignature, NowPaymentsIpnPayload } from "@/lib/nowpayments";

export async function POST(req: NextRequest) {
  // 1. HMAC Signature Verification: Intercept incoming raw body text
  const rawBody = await req.text();
  const signature = req.headers.get("x-nowpayments-sig");

  if (!signature) {
    console.warn("NOWPayments IPN rejected: Missing 'x-nowpayments-sig' header.");
    return new Response("Missing x-nowpayments-sig header", { status: 401 });
  }

  let payload: NowPaymentsIpnPayload;
  try {
    payload = JSON.parse(rawBody);
  } catch (parseError) {
    console.warn("NOWPayments IPN rejected: Failed to parse raw body as JSON.", parseError);
    return new Response("Malformed JSON payload", { status: 400 });
  }

  // Alphabetically sort payload keys and compute HMAC-SHA512
  const isValid = verifyIpnSignature(payload, signature);

  if (!isValid) {
    console.warn(
      `NOWPayments IPN rejected: Signature verification failed. Received header: ${signature}`
    );
    return new Response("Unauthorized: Invalid IPN signature", { status: 401 });
  }

  // 2. Idempotency & Status Processing
  const { order_id, payment_status, payment_id } = payload;

  if (!order_id) {
    console.error("NOWPayments IPN error: 'order_id' is missing in payload.");
    return NextResponse.json({ error: "Missing order_id" }, { status: 400 });
  }

  // Lookup the pending transaction in database by order_id or invoice/payment reference
  const transaction = await prisma.payment.findFirst({
    where: {
      OR: [
        { id: String(order_id) },
        { providerReference: String(order_id) },
        ...(payload.invoice_id
          ? [{ providerReference: String(payload.invoice_id) }]
          : []),
      ],
    },
    include: {
      user: {
        include: {
          subscription: true,
        },
      },
    },
  });

  if (!transaction) {
    console.error(`NOWPayments IPN error: Transaction not found for order_id: '${order_id}'`);
    return NextResponse.json(
      { error: `Transaction not found for order_id: ${order_id}` },
      { status: 404 }
    );
  }

  // Check state idempotency: If already completed / finished, return 200 immediately
  if (transaction.status === "COMPLETED") {
    return NextResponse.json(
      { success: true, message: "Transaction already processed and completed." },
      { status: 200 }
    );
  }

  const normalizedStatus = String(payment_status || "").toLowerCase().trim();

  // 3. Status Action Logic
  try {
    // 3a. finished / confirmed
    if (normalizedStatus === "finished" || normalizedStatus === "confirmed") {
      // Calculate period duration based on plan amount
      let durationDays = 30; // Default Monthly Pro
      const amount = transaction.amount;

      if (amount <= 5) {
        durationDays = 1; // Daily Pass
      } else if (amount >= 8 && amount <= 15) {
        durationDays = 7; // Weekly Pass
      } else if (amount >= 75 && amount <= 150) {
        durationDays = 365; // Yearly Pro
      }

      const durationMs = durationDays * 24 * 60 * 60 * 1000;
      const existingSub = transaction.user.subscription;
      const isCurrentlyActive =
        existingSub?.status === "ACTIVE" &&
        existingSub?.currentPeriodEnd &&
        existingSub.currentPeriodEnd.getTime() > Date.now();

      const baseTime = isCurrentlyActive
        ? existingSub!.currentPeriodEnd!.getTime()
        : Date.now();
      const currentPeriodEnd = new Date(baseTime + durationMs);

      const resolvedRef = payment_id
        ? String(payment_id)
        : transaction.providerReference || String(order_id);

      await prisma.$transaction([
        // Update transaction status to completed
        prisma.payment.update({
          where: { id: transaction.id },
          data: {
            status: "COMPLETED",
            providerReference: resolvedRef,
            confirmedAt: new Date(),
          },
        }),
        // Activate/renew the user's subscription in the database
        prisma.subscription.upsert({
          where: { userId: transaction.userId },
          create: {
            userId: transaction.userId,
            status: "ACTIVE",
            currentPeriodEnd,
          },
          update: {
            status: "ACTIVE",
            currentPeriodEnd,
          },
        }),
      ]);

      return NextResponse.json({ success: true, status: "completed" }, { status: 200 });
    }

    // 3b. failed / expired / refunded
    if (
      normalizedStatus === "failed" ||
      normalizedStatus === "expired" ||
      normalizedStatus === "refunded"
    ) {
      const nextStatus = normalizedStatus === "refunded" ? "REFUNDED" : "FAILED";
      const resolvedRef = payment_id
        ? String(payment_id)
        : transaction.providerReference || String(order_id);

      await prisma.payment.update({
        where: { id: transaction.id },
        data: {
          status: nextStatus,
          providerReference: resolvedRef,
        },
      });

      // Keep subscription inactive / set appropriate status if refunded
      if (normalizedStatus === "refunded") {
        const existingSub = transaction.user.subscription;
        if (
          existingSub &&
          existingSub.currentPeriodEnd &&
          existingSub.currentPeriodEnd.getTime() <= Date.now()
        ) {
          await prisma.subscription.update({
            where: { userId: transaction.userId },
            data: { status: "INACTIVE" },
          }).catch(() => null);
        }
      }

      return NextResponse.json({ success: true, status: nextStatus.toLowerCase() }, { status: 200 });
    }

    // 3c. waiting / confirming / sending
    if (
      normalizedStatus === "waiting" ||
      normalizedStatus === "confirming" ||
      normalizedStatus === "sending" ||
      normalizedStatus === "waiting_for_deposit"
    ) {
      const resolvedRef = payment_id
        ? String(payment_id)
        : transaction.providerReference || String(order_id);

      // Update transaction state to pending processing without modifying active subscription state
      await prisma.payment.update({
        where: { id: transaction.id },
        data: {
          status: "PENDING",
          providerReference: resolvedRef,
        },
      });

      return NextResponse.json({ success: true, status: "pending" }, { status: 200 });
    }

    // Fallback for unhandled or intermediary status
    return NextResponse.json({ success: true, status: normalizedStatus }, { status: 200 });
  } catch (error: any) {
    console.error("NOWPayments IPN database update failed:", error);
    return NextResponse.json(
      { error: "Internal database update error during IPN processing." },
      { status: 500 }
    );
  }
}
