import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getPlanById } from "@/lib/plan-config";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { planId = "monthly", paymentMethod = "CARD", currency = "USD" } = body;

    const plan = getPlanById(planId);
    let session = null;
    try {
      session = await auth();
    } catch {}
    const userId = session?.user?.id;

    // If user is logged in, record or activate subscription in Prisma
    if (userId) {
      try {
        const periodDays =
          plan.interval === "year"
            ? 365
            : plan.interval === "week"
            ? 7
            : plan.interval === "day"
            ? 1
            : 30;

        const currentPeriodEnd = new Date(Date.now() + periodDays * 86400 * 1000);

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

        // Record completed test transaction
        await prisma.payment.create({
          data: {
            userId,
            provider: paymentMethod === "CRYPTO" ? "CRYPTO_SANDBOX" : "STRIPE_SANDBOX",
            providerReference: `sandbox_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
            amount: plan.priceUsd,
            currency: currency.toUpperCase(),
            status: "COMPLETED",
            confirmedAt: new Date(),
          },
        });
      } catch (dbError) {
        console.warn("DB update skipped in sandbox checkout:", dbError);
      }
    }

    // Set sandbox_pro cookie so server components immediately recognise Pro status
    const response = NextResponse.json({
      success: true,
      planId: plan.id,
      planName: plan.name,
      redirectUrl: "/dashboard?payment=success",
    });

    response.cookies.set("sandbox_pro", "true", {
      path: "/",
      maxAge: 30 * 86400, // 30 days
      httpOnly: false, // Accessible to client-side JS as well
      sameSite: "lax",
    });

    return response;
  } catch (error) {
    console.error("Sandbox checkout error:", error);
    return NextResponse.json(
      { error: "Failed to process sandbox payment." },
      { status: 500 }
    );
  }
}
