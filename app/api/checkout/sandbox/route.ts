import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getPlanById } from "@/lib/plan-config";
import { ensurePlanExists } from "@/lib/ensure-plans";

export async function POST(req: Request) {
  try {
    if (process.env.NODE_ENV === "production" || process.env.ALLOW_SANDBOX_CHECKOUT !== "true") {
      return NextResponse.json(
        { error: "Sandbox checkout is disabled." },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { planId = "monthly", paymentMethod = "CRYPTO", currency = "USDT" } = body;

    const plan = getPlanById(planId);
    let session = null;
    try {
      session = await auth();
    } catch {}
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized: Please sign in or create an account to activate your subscription." },
        { status: 401 }
      );
    }

    const activePlanId = await ensurePlanExists(plan.id);

    // Record or activate subscription in Prisma
    const periodDays = plan.interval === "year" ? 365 : 30;
    const currentPeriodEnd = new Date(Date.now() + periodDays * 86400 * 1000);

    try {
      await prisma.subscription.upsert({
        where: { userId },
        create: {
          userId,
          planId: activePlanId,
          status: "ACTIVE",
          source: "MANUAL_OVERRIDE",
          currentPeriodEnd,
        },
        update: {
          planId: activePlanId,
          status: "ACTIVE",
          source: "MANUAL_OVERRIDE",
          currentPeriodEnd,
        },
      });
    } catch (subError) {
      console.warn("Failed with activePlanId, falling back to basic activation:", subError);
      await prisma.subscription.upsert({
        where: { userId },
        create: {
          userId,
          status: "ACTIVE",
          source: "MANUAL_OVERRIDE",
          currentPeriodEnd,
        },
        update: {
          status: "ACTIVE",
          source: "MANUAL_OVERRIDE",
          currentPeriodEnd,
        },
      });
    }

    // Record completed test transaction
    await prisma.payment.create({
      data: {
        userId,
        provider: "CRYPTO_SANDBOX",
        providerReference: `sandbox_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
        amount: plan.priceUsd,
        currency: currency.toUpperCase(),
        status: "COMPLETED",
        confirmedAt: new Date(),
      },
    });

    const response = NextResponse.json({
      success: true,
      planId: plan.id,
      planName: plan.name,
      redirectUrl: "/dashboard?payment=success",
    });

    // Clear any stale sandbox cookies
    response.cookies.delete("sandbox_pro");
    response.cookies.delete("pro_access");

    return response;
  } catch (error) {
    console.error("Sandbox checkout error:", error);
    return NextResponse.json(
      { error: "Failed to process sandbox payment." },
      { status: 500 }
    );
  }
}
