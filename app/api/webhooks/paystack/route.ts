import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPaystackWebhook, verifyPaystackTransaction } from "@/lib/paystack";
import { ensurePlanExists } from "@/lib/ensure-plans";

// Commission rate for referrals (20% of payment amount)
const REFERRAL_COMMISSION_PERCENT = 0.2;
// Free subscription days granted to referrer per successful referral
const REFERRAL_REWARD_DAYS = 7;

export async function POST(req: NextRequest) {
  // 1. Verify Paystack webhook signature
  const rawBody = await req.text();
  const signature = req.headers.get("x-paystack-signature");

  if (!signature) {
    console.warn("Paystack webhook rejected: Missing 'x-paystack-signature' header.");
    return new Response("Missing x-paystack-signature", { status: 401 });
  }

  const isValid = verifyPaystackWebhook(rawBody, signature);
  if (!isValid) {
    console.warn("Paystack webhook rejected: Invalid signature.");
    return new Response("Unauthorized: Invalid webhook signature", { status: 401 });
  }

  let event: any;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return new Response("Malformed JSON payload", { status: 400 });
  }

  // 2. Only process charge.success events (the definitive success event)
  if (event.event !== "charge.success") {
    // Acknowledge other events without processing
    return NextResponse.json({ received: true, event: event.event }, { status: 200 });
  }

  const eventData = event.data;
  const reference = eventData?.reference;
  const paystackStatus = eventData?.status;

  if (!reference) {
    console.error("Paystack webhook: Missing reference in charge.success event.");
    return NextResponse.json({ error: "Missing reference" }, { status: 400 });
  }

  // 3. Verify transaction directly with Paystack API (double-verify for security)
  let verified;
  try {
    verified = await verifyPaystackTransaction(reference);
    if (!verified.status || verified.data.status !== "success") {
      console.warn(`Paystack webhook: Transaction ${reference} verification returned non-success.`);
      return NextResponse.json({ received: true, skipped: "not_verified_success" }, { status: 200 });
    }
  } catch (verifyError) {
    console.error("Paystack transaction verification error:", verifyError);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }

  // 4. Find our payment record by providerReference (which is the Paystack reference)
  const transaction = await prisma.payment.findFirst({
    where: {
      OR: [
        { providerReference: reference },
        { id: reference }, // fallback if reference === our payment.id
      ],
    },
    include: {
      user: {
        include: { subscription: true },
      },
    },
  });

  if (!transaction) {
    console.error(`Paystack webhook: Payment record not found for reference: ${reference}`);
    return NextResponse.json({ error: "Payment record not found" }, { status: 404 });
  }

  // 5. Idempotency: skip if already completed
  if (transaction.status === "COMPLETED") {
    return NextResponse.json({ success: true, message: "Already processed." }, { status: 200 });
  }

  // 6. Calculate subscription duration from amount
  const amount = transaction.amount;
  let durationDays = 30; // default monthly

  if (amount >= 100) {
    durationDays = 365; // Yearly
  } else if (amount <= 5) {
    durationDays = 1;
  } else if (amount >= 8 && amount <= 15) {
    durationDays = 7;
  } else {
    durationDays = 30; // Monthly ($48)
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

  const targetPlanId =
    durationDays >= 365 ? "yearly" : durationDays <= 7 ? "weekly" : "monthly";
  const activePlanId = await ensurePlanExists(targetPlanId);

  try {
    // 7. Activate subscription in a transaction
    await prisma.$transaction([
      prisma.payment.update({
        where: { id: transaction.id },
        data: {
          status: "COMPLETED",
          providerReference: reference,
          confirmedAt: new Date(),
        },
      }),
      prisma.subscription.upsert({
        where: { userId: transaction.userId },
        create: {
          userId: transaction.userId,
          planId: activePlanId,
          status: "ACTIVE",
          source: "STRIPE", // reusing existing enum value for card payments
          currentPeriodEnd,
        },
        update: {
          planId: activePlanId,
          status: "ACTIVE",
          currentPeriodEnd,
        },
      }),
    ]);
  } catch (dbError) {
    console.error("Paystack webhook: DB transaction failed:", dbError);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  // 8. Referral reward (non-blocking, same as NOWPayments webhook)
  try {
    if (prisma.user?.findUnique) {
      const payingUser = await prisma.user.findUnique({
        where: { id: transaction.userId },
        select: { referredByCode: true },
      });

      if (payingUser?.referredByCode) {
        const referrer = await prisma.user.findUnique({
          where: { referralCode: payingUser.referredByCode },
          include: { subscription: true },
        });

        if (referrer && prisma.referralEarning?.findFirst) {
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

            await prisma.$transaction([
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
          }
        }
      }
    }
  } catch (referralError) {
    console.error("Paystack referral reward error (non-critical):", referralError);
  }

  console.log(
    `Paystack: Subscription activated for userId=${transaction.userId}, plan=${targetPlanId}, durationDays=${durationDays}`
  );

  return NextResponse.json({ success: true, status: "completed" }, { status: 200 });
}

