"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { activateSuccessfulPayment } from "@/lib/payment-activation";
import { getPlanById } from "@/lib/plan-config";

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
  revalidatePath("/dashboard");

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
  revalidatePath("/dashboard");

  return { success: true };
}

/**
 * Resets an operator's passkey/password directly from the administrative portal.
 * Allows setting a specific new password or generates a secure temporary passkey.
 * Only callable by users with ADMIN role.
 */
export async function adminResetPassword(userId: string, customPassword?: string) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN" || !session?.user?.id) {
    throw new Error("Unauthorized: Root administrative privileges required.");
  }

  if (!userId) {
    throw new Error("Target userId is required.");
  }

  const bcrypt = await import("bcryptjs");
  const crypto = await import("crypto");

  const newPassword =
    customPassword && customPassword.trim().length >= 8
      ? customPassword.trim()
      : `GoldPass-${crypto.randomBytes(3).toString("hex").toUpperCase()}!`;

  const passwordHash = await bcrypt.hash(newPassword, 10);

  const targetUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });

  if (!targetUser) {
    throw new Error("Target operator not found.");
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    }),
    prisma.adminAuditEvent.create({
      data: {
        adminUserId: session.user.id,
        targetUserId: userId,
        action: "ADMIN_RESET_PASSWORD",
        reason: `Passkey reset by administrator for operator ${targetUser.email}`,
      },
    }),
  ]);

  revalidatePath("/admin");

  return {
    success: true,
    newPassword,
    email: targetUser.email,
  };
}

/**
 * Approves a pending Paybill / manual payment record and activates the user's Pro subscription
 * for the corresponding plan duration (30 days for Monthly $48, 365 days for Yearly $188).
 * Only callable by users with ADMIN role.
 */
export async function approveManualPayment(paymentId: string, note?: string) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN" || !session?.user?.id) {
    throw new Error("Unauthorized: Root administrative privileges required.");
  }

  if (!paymentId) {
    throw new Error("Payment ID is required.");
  }

  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { user: { select: { id: true, email: true } } },
  });

  if (!payment) {
    throw new Error("Payment record not found.");
  }

  if (payment.status === "COMPLETED") {
    throw new Error("This payment has already been approved and activated.");
  }

  // Allow re-approving a previously failed/pending record by ensuring it starts from PENDING before activation
  if (payment.status !== "PENDING") {
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: "PENDING" },
    });
  }

  const activationResult = await activateSuccessfulPayment(
    payment.id,
    payment.providerReference || `PAYBILL-APPROVED-${payment.id}`
  );

  if (!activationResult.success) {
    throw new Error(activationResult.error || "Failed to activate payment.");
  }

  const auditReason =
    (note && note.trim()) ||
    `Manual payment approved (${payment.provider}${
      payment.providerReference ? ` · Ref: ${payment.providerReference}` : ""
    } · $${payment.amount.toFixed(2)}).`;

  await prisma.adminAuditEvent.create({
    data: {
      adminUserId: session.user.id,
      targetUserId: payment.userId,
      action: "APPROVE_MANUAL_PAYMENT",
      reason: auditReason,
    },
  });

  revalidatePath("/admin");
  revalidatePath("/terminal");
  revalidatePath("/dashboard");
  revalidatePath("/account");
  revalidatePath("/pricing");
  revalidatePath("/checkout");
  revalidatePath("/payment/status");

  return {
    success: true,
    email: payment.user.email,
    amount: payment.amount,
  };
}

/**
 * Rejects / marks a pending Paybill / manual payment record as FAILED without granting access.
 * Only callable by users with ADMIN role.
 */
export async function rejectManualPayment(paymentId: string, reason?: string) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN" || !session?.user?.id) {
    throw new Error("Unauthorized: Root administrative privileges required.");
  }

  if (!paymentId) {
    throw new Error("Payment ID is required.");
  }

  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { user: { select: { id: true, email: true } } },
  });

  if (!payment) {
    throw new Error("Payment record not found.");
  }

  if (payment.status === "COMPLETED") {
    throw new Error("Cannot reject an already completed payment. Use Revoke VIP instead.");
  }

  const validReason =
    (reason && reason.trim()) ||
    `Manual payment proof rejected (${payment.provider}${
      payment.providerReference ? ` · Ref: ${payment.providerReference}` : ""
    }).`;

  await prisma.$transaction([
    prisma.payment.update({
      where: { id: payment.id },
      data: { status: "FAILED" },
    }),
    prisma.adminAuditEvent.create({
      data: {
        adminUserId: session.user.id,
        targetUserId: payment.userId,
        action: "REJECT_MANUAL_PAYMENT",
        reason: validReason,
      },
    }),
  ]);

  revalidatePath("/admin");
  revalidatePath("/payment/status");

  return {
    success: true,
    email: payment.user.email,
  };
}

/**
 * Approves a customer directly by email (for customers who sent Paybill proof
 * directly to Support@xauusdtracker.com without clicking Submit on checkout).
 * Finds or creates the user, records a COMPLETED PAYBILL payment, and activates Pro access.
 */
export async function approveManualPaymentByEmail(input: {
  email: string;
  planId: string;
  reference?: string;
  note?: string;
}) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN" || !session?.user?.id) {
    throw new Error("Unauthorized: Root administrative privileges required.");
  }

  const cleanEmail = (input.email || "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    throw new Error("Please enter a valid customer email address.");
  }

  const plan = getPlanById(input.planId || "monthly");
  const bcrypt = await import("bcryptjs");

  let user = await prisma.user.findUnique({
    where: { email: cleanEmail },
  });

  let createdNewAccount = false;
  if (!user) {
    const tempHash = await bcrypt.hash(`xau_${Date.now()}_${Math.random()}`, 10);
    user = await prisma.user.create({
      data: {
        email: cleanEmail,
        passwordHash: tempHash,
        role: "USER",
        subscription: {
          create: { status: "INACTIVE" },
        },
      },
    });
    createdNewAccount = true;
  }

  const cleanRefInput = (input.reference || "").trim().toUpperCase();
  let finalReference =
    cleanRefInput ||
    `PB-DIRECT-${Date.now().toString(36).toUpperCase()}-${Math.random()
      .toString(36)
      .slice(2, 6)
      .toUpperCase()}`;

  if (cleanRefInput) {
    const existingByRef = await prisma.payment.findUnique({
      where: { providerReference: finalReference },
    });
    if (existingByRef) {
      if (existingByRef.status === "COMPLETED") {
        throw new Error(
          `Reference '${finalReference}' is already linked to a completed payment.`
        );
      }
      finalReference = `${finalReference}-${Math.random()
        .toString(36)
        .slice(2, 5)
        .toUpperCase()}`;
    }
  }

  const payment = await prisma.payment.create({
    data: {
      userId: user.id,
      provider: "PAYBILL",
      providerReference: finalReference,
      amount: plan.priceUsd,
      currency: "USD",
      status: "PENDING",
    },
  });

  const activationResult = await activateSuccessfulPayment(payment.id, finalReference);
  if (!activationResult.success) {
    throw new Error(activationResult.error || "Failed to activate subscription.");
  }

  const auditReason =
    (input.note && input.note.trim()) ||
    `Direct Paybill approval for ${plan.name} ($${plan.priceUsd}) · Ref: ${finalReference}`;

  await prisma.adminAuditEvent.create({
    data: {
      adminUserId: session.user.id,
      targetUserId: user.id,
      action: "APPROVE_MANUAL_PAYMENT",
      reason: auditReason,
    },
  });

  revalidatePath("/admin");
  revalidatePath("/terminal");
  revalidatePath("/dashboard");
  revalidatePath("/account");
  revalidatePath("/pricing");
  revalidatePath("/checkout");
  revalidatePath("/payment/status");

  return {
    success: true,
    email: user.email,
    planName: plan.name,
    amountUsd: plan.priceUsd,
    reference: finalReference,
    createdNewAccount,
  };
}

