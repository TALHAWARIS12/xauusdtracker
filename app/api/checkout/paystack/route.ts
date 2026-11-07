import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getPlanById } from "@/lib/plan-config";
import { initializePaystackTransaction } from "@/lib/paystack";

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

    // 2. Parse and validate planId
    const body = await req.json().catch(() => ({}));
    const { planId } = body;

    if (!planId || typeof planId !== "string") {
      return NextResponse.json(
        { error: "Validation Error: 'planId' is required." },
        { status: 400 }
      );
    }

    const configPlan = getPlanById(planId);
    const priceUsd = configPlan.priceUsd;
    const planName = configPlan.name;

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
        provider: "PAYSTACK",
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

    // 5. Initialize Paystack transaction
    let paystackData;
    try {
      const result = await initializePaystackTransaction({
        email: userEmail,
        amountUsd: priceUsd,
        reference: payment.id, // Use our internal payment ID as the Paystack reference
        callback_url: `${appUrl}/payment/status?order_id=${payment.id}&status=success&provider=paystack`,
        metadata: {
          userId,
          planId,
          orderId: payment.id,
          planName,
        },
      });

      if (!result.status || !result.data?.authorization_url) {
        throw new Error(result.message || "Failed to create Paystack session.");
      }

      paystackData = result.data;
    } catch (apiError: any) {
      // Mark payment as failed if Paystack initialization fails
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: "FAILED" },
      }).catch(() => null);

      console.error("Paystack initialization error:", apiError);
      return NextResponse.json(
        { error: apiError?.message || "Failed to initialize Paystack payment." },
        { status: 502 }
      );
    }

    // 6. Store Paystack reference against our payment record
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        providerReference: paystackData.reference,
      },
    });

    // 7. Return checkout URL
    return NextResponse.json({
      checkoutUrl: paystackData.authorization_url,
      orderId: payment.id,
      reference: paystackData.reference,
    });
  } catch (error: any) {
    console.error("Paystack checkout route error:", error);
    return NextResponse.json(
      { error: "Internal server error processing card checkout." },
      { status: 500 }
    );
  }
}

