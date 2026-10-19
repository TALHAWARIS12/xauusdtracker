"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

/**
 * Grants 30-day VIP subscription to a user without requiring Stripe checkout.
 * Records override reason and creates an AdminAuditEvent.
 * Only callable by users with ADMIN role.
 */
export async function grantManualVip(userId: string, reason?: string) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN" || !session?.user?.id) {
    throw new Error("Unauthorized: Root administrative privileges required.");
  }

  if (!userId) {
    throw new Error("Target userId is required.");
  }

  const validReason = (reason && reason.trim()) || "Manual VIP clearance granted by administrator.";
  const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  // Retrieve plan if available
  const plan = await prisma.plan.findFirst();

  await prisma.$transaction([
    prisma.subscription.upsert({
      where: { userId },
      create: {
        userId,
        planId: plan?.id,
        status: "ACTIVE",
        source: "MANUAL_OVERRIDE",
        currentPeriodEnd: thirtyDaysFromNow,
      },
      update: {
        status: "ACTIVE",
        source: "MANUAL_OVERRIDE",
        currentPeriodEnd: thirtyDaysFromNow,
      },
    }),
    prisma.adminAuditEvent.create({
      data: {
        adminUserId: session.user.id,
        targetUserId: userId,
        action: "GRANT_MANUAL_VIP",
        reason: validReason,
      },
    }),
  ]);

  revalidatePath("/admin");
  revalidatePath("/terminal");

  return { success: true };
}

/**
 * Revokes VIP / Active subscription, setting status to INACTIVE.
 * Records revocation reason and creates an AdminAuditEvent.
 * Only callable by users with ADMIN role.
 */
export async function revokeVip(userId: string, reason?: string) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN" || !session?.user?.id) {
    throw new Error("Unauthorized: Root administrative privileges required.");
  }

  if (!userId) {
    throw new Error("Target userId is required.");
  }

  const validReason = (reason && reason.trim()) || "Manual VIP clearance revoked by administrator.";

  await prisma.$transaction([
    prisma.subscription.upsert({
      where: { userId },
      create: {
        userId,
        status: "INACTIVE",
        source: "MANUAL_OVERRIDE",
        currentPeriodEnd: null,
      },
      update: {
        status: "INACTIVE",
        source: "MANUAL_OVERRIDE",
        currentPeriodEnd: null,
      },
    }),
    prisma.adminAuditEvent.create({
      data: {
        adminUserId: session.user.id,
        targetUserId: userId,
        action: "REVOKE_VIP",
        reason: validReason,
      },
    }),
  ]);

  revalidatePath("/admin");
  revalidatePath("/terminal");

  return { success: true };
}
