"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { randomBytes } from "crypto";

/**
 * Generates a unique referral code for the currently authenticated user.
 * If the user already has a code, returns the existing one.
 */
export async function generateReferralCode(): Promise<{
  success: boolean;
  code?: string;
  error?: string;
}> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "You must be signed in." };
  }

  const userId = session.user.id;

  // Return existing code if already set
  const existing = await prisma.user.findUnique({
    where: { id: userId },
    select: { referralCode: true },
  });

  if (existing?.referralCode) {
    return { success: true, code: existing.referralCode };
  }

  // Generate a unique 8-character uppercase code
  let code: string;
  let attempts = 0;
  do {
    code = randomBytes(5).toString("hex").toUpperCase().slice(0, 8);
    const collision = await prisma.user.findUnique({
      where: { referralCode: code },
    });
    if (!collision) break;
    attempts++;
  } while (attempts < 10);

  await prisma.user.update({
    where: { id: userId },
    data: { referralCode: code! },
  });

  revalidatePath("/account");

  return { success: true, code: code! };
}

/**
 * Returns referral stats for the currently authenticated user.
 */
export async function getReferralStats(): Promise<{
  referralCode: string | null;
  totalReferrals: number;
  activeReferrals: number;
  totalRewardDays: number;
  totalCommissionUsd: number;
  earnings: Array<{
    id: string;
    referredUserId: string;
    commissionUsd: number;
    rewardDays: number;
    status: string;
    createdAt: string;
    grantedAt: string | null;
  }>;
}> {
  const session = await auth();
  if (!session?.user?.id) {
    return {
      referralCode: null,
      totalReferrals: 0,
      activeReferrals: 0,
      totalRewardDays: 0,
      totalCommissionUsd: 0,
      earnings: [],
    };
  }

  const userId = session.user.id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      referralCode: true,
      referralEarnings: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          referredUserId: true,
          commissionUsd: true,
          rewardDays: true,
          status: true,
          createdAt: true,
          grantedAt: true,
        },
      },
    },
  });

  if (!user) {
    return {
      referralCode: null,
      totalReferrals: 0,
      activeReferrals: 0,
      totalRewardDays: 0,
      totalCommissionUsd: 0,
      earnings: [],
    };
  }

  const earnings = user.referralEarnings ?? [];
  const granted = earnings.filter((e) => e.status === "GRANTED" || e.status === "PAID_OUT");

  return {
    referralCode: user.referralCode ?? null,
    totalReferrals: earnings.length,
    activeReferrals: granted.length,
    totalRewardDays: granted.reduce((sum, e) => sum + e.rewardDays, 0),
    totalCommissionUsd: granted.reduce((sum, e) => sum + e.commissionUsd, 0),
    earnings: earnings.map((e) => ({
      id: e.id,
      referredUserId: e.referredUserId,
      commissionUsd: e.commissionUsd,
      rewardDays: e.rewardDays,
      status: e.status,
      createdAt: e.createdAt.toISOString(),
      grantedAt: e.grantedAt?.toISOString() ?? null,
    })),
  };
}

