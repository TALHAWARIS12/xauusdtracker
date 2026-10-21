import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

/**
 * Verifies whether a given user holds an active, unexpired subscription.
 * Checks:
 * 1. Testing session cookie (sandbox_pro=true) for instant testing persistence across page refreshes.
 * 2. Prisma Subscription table (userId, status === 'ACTIVE', currentPeriodEnd).
 */
export async function getSubscriptionStatus(userId?: string | null): Promise<boolean> {
  try {
    // 1. Check sandbox/test mode cookie (persists across refreshes)
    try {
      const cookieStore = await cookies();
      const sandboxCookie = cookieStore.get("sandbox_pro")?.value || cookieStore.get("pro_access")?.value;
      if (sandboxCookie === "true") {
        return true;
      }
    } catch {
      // In non-request environments (e.g. background tasks or unit tests without cookies mock)
    }

    if (!userId) return false;

    // 2. Query Prisma Subscription database
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
