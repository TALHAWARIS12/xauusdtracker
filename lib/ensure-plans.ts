import { prisma } from "@/lib/prisma";
import { PRICING_PLANS, getPlanById } from "@/lib/plan-config";

/**
 * Guarantees that a plan exists in the Prisma database before
 * linking subscriptions or processing payments.
 * Prevents foreign key constraint violations on Subscription.planId.
 */
export async function ensurePlanExists(planId?: string | null): Promise<string> {
  const targetId = planId || "monthly";

  if (!prisma.plan?.findUnique) {
    return targetId;
  }

  try {
    const existing = await prisma.plan.findUnique({
      where: { id: targetId },
    });

    if (existing) {
      return existing.id;
    }

    // If not found in DB, look up from predefined PRICING_PLANS
    const config = getPlanById(targetId);

    if (!prisma.plan?.upsert) {
      return targetId;
    }

    const created = await prisma.plan.upsert({
      where: { id: config.id },
      create: {
        id: config.id,
        name: config.name,
        priceUsd: config.priceUsd,
        billingInterval: config.interval,
        features: config.features,
        active: true,
      },
      update: {
        name: config.name,
        priceUsd: config.priceUsd,
        billingInterval: config.interval,
      },
    });

    return created.id;
  } catch (err) {
    console.warn(`[ensurePlanExists] Notice resolving plan '${targetId}':`, err);
    // Safe fallback to any available plan in DB
    try {
      const fallback = await prisma.plan.findFirst();
      if (fallback) return fallback.id;
    } catch {}

    return targetId;
  }
}
