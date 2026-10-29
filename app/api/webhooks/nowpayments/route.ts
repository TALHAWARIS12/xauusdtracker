import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyIpnSignature, NowPaymentsIpnPayload } from "@/lib/nowpayments";
import { ensurePlanExists } from "@/lib/ensure-plans";

// Commission rate for referrals (20% of payment amount)
const REFERRAL_COMMISSION_PERCENT = 0.2;
// Free subscription days granted to referrer per successful referral
const REFERRAL_REWARD_DAYS = 7;

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
      let durationDays = 30; // Default Monthly Pro ($48)
      const amount = transaction.amount;

      if (amount >= 100) {
        durationDays = 365; // Yearly Pro ($188)
      } else if (amount <= 5) {
        durationDays = 1; // Legacy Daily Pass
      } else if (amount >= 8 && amount <= 15) {
        durationDays = 7; // Legacy Weekly Pass
      } else {
        durationDays = 30; // Monthly Pro ($48)
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

      const targetPlanId = durationDays >= 365 ? "yearly" : (durationDays <= 7 ? "weekly" : "monthly");
      const activePlanId = await ensurePlanExists(targetPlanId);

      try {
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
          // Activate/renew the user's subscription in the database with the resolved planId
          prisma.subscription.upsert({
            where: { userId: transaction.userId },
            create: {
              userId: transaction.userId,
              planId: activePlanId,
              status: "ACTIVE",
              currentPeriodEnd,
            },
            update: {
              planId: activePlanId,
              status: "ACTIVE",
              currentPeriodEnd,
            },
          }),
        ]);
      } catch (txError) {
        console.warn("Primary transaction failed, attempting resilient fallback activation:", txError);
        // Fallback: Ensure subscription is activated even if foreign key relation has any issue
        await prisma.payment.update({
          where: { id: transaction.id },
          data: {
            status: "COMPLETED",
            providerReference: resolvedRef,
            confirmedAt: new Date(),
          },
        }).catch(() => null);

        await prisma.subscription.upsert({
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
        });
      }

      // ─────────────────────────────────────────────────────────────
      // 4. REFERRAL REWARD: Check if paying user was referred by anyone
      // ─────────────────────────────────────────────────────────────
      try {
        if (prisma.user?.findUnique) {
          const payingUser = await prisma.user.findUnique({
            where: { id: transaction.userId },
            select: { referredByCode: true },
          });

          if (payingUser?.referredByCode) {
            // Find the referrer by their referral code
            const referrer = await prisma.user.findUnique({
              where: { referralCode: payingUser.referredByCode },
              include: { subscription: true },
            });

            if (referrer && prisma.referralEarning?.findFirst) {
              // Check if this referral has already been rewarded (idempotency)
              const existingEarning = await prisma.referralEarning.findFirst({
                where: {
                  referrerId: referrer.id,
                  referredUserId: transaction.userId,
                  status: { in: ["GRANTED", "PAID_OUT"] },
                },
              });

              if (!existingEarning) {
                const commissionUsd = parseFloat(
                  (transaction.amount * REFERRAL_COMMISSION_PERCENT).toFixed(2)
                );

                // Calculate new subscription end for referrer (+REFERRAL_REWARD_DAYS)
                const referrerSub = referrer.subscription;
                const referrerIsActive =
                  referrerSub?.status === "ACTIVE" &&
                  referrerSub?.currentPeriodEnd &&
                  referrerSub.currentPeriodEnd.getTime() > Date.now();

                const referrerBaseTime = referrerIsActive
                  ? referrerSub!.currentPeriodEnd!.getTime()
                  : Date.now();

                const referrerNewEnd = new Date(
                  referrerBaseTime + REFERRAL_REWARD_DAYS * 24 * 60 * 60 * 1000
                );

                // Grant referral reward and extend referrer's subscription
                await prisma.$transaction([
                  // Create earning record
                  prisma.referralEarning.create({
                    data: {
                      referrerId: referrer.id,
                      referredUserId: transaction.userId,
                      paymentId: transaction.id,
                      commissionUsd,
                      rewardDays: REFERRAL_REWARD_DAYS,
                      status: "GRANTED",
                      grantedAt: new Date(),
                    },
                  }),
                  // Extend referrer's subscription with free days
                  prisma.subscription.upsert({
                    where: { userId: referrer.id },
                    create: {
                      userId: referrer.id,
                      status: "ACTIVE",
                      currentPeriodEnd: referrerNewEnd,
                    },
                    update: {
                      status: "ACTIVE",
                      currentPeriodEnd: referrerNewEnd,
                    },
                  }),
                ]);

                console.log(
                  `Referral reward granted: referrer=${referrer.id} earned $${commissionUsd} commission + ${REFERRAL_REWARD_DAYS} free days for referring user ${transaction.userId}`
                );
              }
            }
          }
        }
      } catch (referralError) {
        // Referral reward failure must NEVER block the primary payment confirmation
        console.error("Referral reward processing error (non-critical):", referralError);
      }

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
