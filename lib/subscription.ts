import { prisma } from "@/lib/prisma";

/**
 * Verifies whether a given user holds an active, unexpired subscription.
 * Queries Prisma Subscription where userId === userId and status === 'ACTIVE'.
 * If active and currentPeriodEnd > now(), returns true. Otherwise false.
 */
export async function getSubscriptionStatus(userId: string): Promise<boolean> {
  if (!userId) return false;

  try {
    const subscription = await prisma.subscription.findUnique({
      where: { userId },
      select: {
        status: true,
        currentPeriodEnd: true,
      },
    });

    if (!subscription) return false;

    if (subscription.status === "ACTIVE") {
      // If no expiration date is recorded, treat as currently valid
      if (!subscription.currentPeriodEnd) return true;
      return subscription.currentPeriodEnd.getTime() > Date.now();
    }

    return false;
  } catch (error) {
    console.error("Error verifying subscription status:", error);
    return false;
  }
}
