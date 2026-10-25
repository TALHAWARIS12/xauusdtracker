import { prisma } from "@/lib/prisma";

export interface SubscriptionInfo {
  isSubscribed: boolean;
  planId: string | null;
  status: string;
  currentPeriodEnd: Date | null;
}

/**
 * Verifies whether a given user holds an active, unexpired subscription in the database.
 * Strictly queries the Prisma Subscription table. Returns false for unauthenticated users
 * or users without an active, unexpired plan.
 */
export async function getSubscriptionStatus(userId?: string | null): Promise<boolean> {
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
      if (!subscription.currentPeriodEnd) return true;
      return subscription.currentPeriodEnd.getTime() > Date.now();
    }

    return false;
  } catch (error) {
    console.error("Error verifying subscription status:", error);
    return false;
  }
}

/**
 * Returns complete subscription details including active planId.
 */
export async function getUserSubscription(userId?: string | null): Promise<SubscriptionInfo> {
  if (!userId) {
    return {
      isSubscribed: false,
      planId: null,
      status: "INACTIVE",
      currentPeriodEnd: null,
    };
  }

  try {
    const subscription = await prisma.subscription.findUnique({
      where: { userId },
      select: {
        planId: true,
        status: true,
        currentPeriodEnd: true,
      },
    });

    if (!subscription) {
      return {
        isSubscribed: false,
        planId: null,
        status: "INACTIVE",
        currentPeriodEnd: null,
      };
    }

    const isExpired = subscription.currentPeriodEnd
      ? subscription.currentPeriodEnd.getTime() <= Date.now()
      : false;

    const isSubscribed = subscription.status === "ACTIVE" && !isExpired;

    return {
      isSubscribed,
      planId: isSubscribed ? subscription.planId : null,
      status: isExpired ? "EXPIRED" : subscription.status,
      currentPeriodEnd: subscription.currentPeriodEnd,
    };
  } catch (error) {
    console.error("Error fetching user subscription details:", error);
    return {
      isSubscribed: false,
      planId: null,
      status: "INACTIVE",
      currentPeriodEnd: null,
    };
  }
}
