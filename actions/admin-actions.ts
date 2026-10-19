"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

/**
 * Grants 30-day VIP subscription to a user without requiring Stripe checkout.
 * Only callable by users with ADMIN role.
 */
export async function grantManualVip(userId: string) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    throw new Error("Unauthorized: Root administrative privileges required.");
  }

  if (!userId) {
    throw new Error("Target userId is required.");
  }

  const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  await prisma.subscription.upsert({
    where: { userId },
    create: {
      userId,
      status: "ACTIVE",
      currentPeriodEnd: thirtyDaysFromNow,
    },
    update: {
      status: "ACTIVE",
      currentPeriodEnd: thirtyDaysFromNow,
    },
  });

  revalidatePath("/admin");
  revalidatePath("/terminal");

  return { success: true };
}

/**
 * Revokes VIP / Active subscription, setting status to INACTIVE.
 * Only callable by users with ADMIN role.
 */
export async function revokeVip(userId: string) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    throw new Error("Unauthorized: Root administrative privileges required.");
  }

  if (!userId) {
    throw new Error("Target userId is required.");
  }

  await prisma.subscription.upsert({
    where: { userId },
    create: {
      userId,
      status: "INACTIVE",
      currentPeriodEnd: null,
    },
    update: {
      status: "INACTIVE",
      currentPeriodEnd: null,
    },
  });

  revalidatePath("/admin");
  revalidatePath("/terminal");

  return { success: true };
}
