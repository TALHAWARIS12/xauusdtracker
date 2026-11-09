import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getPlanById } from "@/lib/plan-config";
import { createIntaSendCheckoutSession } from "@/lib/intasend";

export async function POST(req: Request) {
  try {
    // 1. Authenticate user
    const session = await auth();
    if (!session?.user?.id || !session.user.email) {
      return NextResponse.json(
        { error: "Unauthorized: Please sign in to initiate payment." },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const userEmail = session.user.email;

    // 2. Parse request payload
    const body = await req.json().catch(() => ({}));
    const { planId, phoneNumber } = body;

    if (!planId || typeof planId !== "string") {
      return NextResponse.json(
        { error: "Validation Error: 'planId' is required." },
        { status: 400 }
      );
    }

    const configPlan = getPlanById(planId);
    const priceUsd = configPlan.priceUsd;

    if (!priceUsd || priceUsd <= 0) {
      return NextResponse.json(
        { error: `Invalid plan price for '${planId}'.` },
        { status: 400 }
      );
    }

    // 3. Create a PENDING payment record in DB
    const payment = await prisma.payment.create({
      data: {
        userId,
        provider: "INTASEND",
        amount: priceUsd,
        currency: "USD",
        status: "PENDING",
      },
    });

    // 4. Determine app base URL
    const url = new URL(req.url);
    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      `${url.protocol}//${url.host}`;

    // 5. Initialize IntaSend checkout session
    let intasendSession;
    try {
      intasendSession = await createIntaSendCheckoutSession({
        amountUsd: priceUsd,
        email: userEmail,
        phoneNumber: typeof phoneNumber === "string" ? phoneNumber.trim() : undefined,
        apiRef: payment.id,
        redirectUrl: `${appUrl}/payment/status?order_id=${payment.id}&provider=intasend`,
      });

      if (!intasendSession?.url) {
        throw new Error(intasendSession?.detail || "Failed to generate IntaSend checkout session URL.");
      }
    } catch (apiError: any) {
      // Mark payment as failed if IntaSend initialization fails
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: "FAILED" },
      }).catch(() => null);

      console.error("IntaSend initialization error:", apiError);
      return NextResponse.json(
        { error: apiError?.message || "Failed to initialize IntaSend checkout." },
        { status: 502 }
      );
    }

    // 6. Store IntaSend checkout ID as initial providerReference
    if (intasendSession.id) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          providerReference: intasendSession.id,
        },
      }).catch(() => null);
    }

    // 7. Return checkout URL to redirect the user
    return NextResponse.json({
      checkoutUrl: intasendSession.url,
      orderId: payment.id,
      checkoutId: intasendSession.id,
    });
  } catch (error: any) {
    console.error("IntaSend checkout route error:", error);
    return NextResponse.json(
      { error: "Internal server error processing IntaSend checkout." },
      { status: 500 }
    );
  }
}
