import { prisma } from "@/lib/prisma";
import { ensurePlanExists } from "@/lib/ensure-plans";

const REFERRAL_COMMISSION_PERCENT = 0.2;
const REFERRAL_REWARD_DAYS = 7;

export async function activateSuccessfulPayment(
  paymentId: string,
  providerReference?: string
) {
  const transaction = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      user: {
        include: { subscription: true },
      },
    },
  });

  if (!transaction) {
    return { success: false, error: "Payment not found" };
  }

  if (transaction.status === "COMPLETED") {
    return { success: true, alreadyCompleted: true, isSubscribed: true };
  }

  // Calculate subscription duration
  const amount = transaction.amount;
  let durationDays = 30; // default monthly

  if (amount >= 100) {
    durationDays = 365; // Yearly
  } else if (amount <= 5) {
    durationDays = 1;
  } else if (amount >= 8 && amount <= 15) {
    durationDays = 7; // Weekly
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

  const finalReference = providerReference || transaction.providerReference || paymentId;

  // Primary activation transaction
  await prisma.$transaction([
    prisma.payment.update({
      where: { id: transaction.id },
      data: {
        status: "COMPLETED",
        providerReference: finalReference,
        confirmedAt: new Date(),
      },
    }),
    prisma.subscription.upsert({
      where: { userId: transaction.userId },
      create: {
        userId: transaction.userId,
        planId: activePlanId,
        status: "ACTIVE",
        source: "STRIPE", // gateway-cleared
        currentPeriodEnd,
      },
      update: {
        planId: activePlanId,
        status: "ACTIVE",
        currentPeriodEnd,
      },
    }),
  ]);

  // Non-blocking referral reward grant
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

            console.log(
              `Referral reward granted: referrer=${referrer.id} earned $${commissionUsd} commission + ${REFERRAL_REWARD_DAYS} free days for user ${transaction.userId}`
            );
          }
        }
      }
    }
  } catch (referralError) {
    console.error("Referral reward error (non-critical):", referralError);
  }

  console.log(
    `Subscription activated for userId=${transaction.userId}, plan=${targetPlanId}, durationDays=${durationDays}`
  );

  return { success: true, alreadyCompleted: false, isSubscribed: true };
}
