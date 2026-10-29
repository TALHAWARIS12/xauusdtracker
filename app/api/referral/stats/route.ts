import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";

/**
 * GET /api/referral/stats
 * Returns referral stats for the authenticated user.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
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
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const earnings = user.referralEarnings ?? [];
  const granted = earnings.filter((e) => e.status === "GRANTED" || e.status === "PAID_OUT");

  return NextResponse.json({
    referralCode: user.referralCode ?? null,
    totalReferrals: earnings.length,
    activeReferrals: granted.length,
    totalRewardDays: granted.reduce((sum, e) => sum + e.rewardDays, 0),
    totalCommissionUsd: granted.reduce((sum, e) => sum + e.commissionUsd, 0),
    earnings: earnings.map((e) => ({
      ...e,
      createdAt: e.createdAt.toISOString(),
      grantedAt: e.grantedAt?.toISOString() ?? null,
    })),
  });
}

