import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getPlanById } from "@/lib/plan-config";
import { createInvoice, getAppBaseUrl } from "@/lib/nowpayments";

export async function POST(req: Request) {
  try {
    // 1. Authenticate the requesting user session using existing auth
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized: Please sign in to initiate payment checkout." },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // 2. Validate incoming planId from the request body
    const body = await req.json().catch(() => ({}));
    const { planId } = body;

    if (!planId || typeof planId !== "string") {
      return NextResponse.json(
        { error: "Validation Error: 'planId' is required and must be a string." },
        { status: 400 }
      );
    }

    // 3. Retrieve plan details (price, duration) from existing plan configuration/DB
    const configPlan = getPlanById(planId);
    let planName = configPlan.name;
    let priceUsd = configPlan.priceUsd;
    let intervalLabel = configPlan.intervalLabel;

    // Optional check in Prisma Plan database if custom plan ID passed
    try {
      if (prisma.plan?.findUnique) {
        const dbPlan = await prisma.plan.findUnique({
          where: { id: planId },
        });

        if (dbPlan) {
          planName = dbPlan.name;
          priceUsd = dbPlan.priceUsd;
          intervalLabel = `/${dbPlan.billingInterval}`;
        }
      }
    } catch {
      // Fallback silently to plan configuration
    }

    if (!priceUsd || priceUsd <= 0) {
      return NextResponse.json(
        { error: `Invalid plan price for plan '${planId}'.` },
        { status: 400 }
      );
    }

    // 4. Record an initial pending transaction in the database with status 'PENDING'
    const payment = await prisma.payment.create({
      data: {
        userId,
        provider: "NOWPAYMENTS",
        amount: priceUsd,
        currency: "USD",
        status: "PENDING",
      },
    });

    const appUrl = getAppBaseUrl(req);

    // 5. Call createInvoice() from NOWPayments service module
    let invoice;
    try {
      invoice = await createInvoice({
        price_amount: priceUsd,
        price_currency: "usd",
        order_id: payment.id,
        order_description: `XAUUSD Intelligence - ${planName} (${intervalLabel})`,
        ipn_callback_url: `${appUrl}/api/webhooks/nowpayments`,
        success_url: `${appUrl}/payment/status?order_id=${payment.id}&status=success`,
        cancel_url: `${appUrl}/payment/status?order_id=${payment.id}&status=cancelled`,
      });
    } catch (apiError: any) {
      // Mark transaction as failed if NOWPayments invoice creation rejected
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: "FAILED" },
      }).catch(() => null);

      console.error("NOWPayments invoice creation error:", apiError);
      return NextResponse.json(
        { error: apiError?.message || "Failed to initialize NOWPayments invoice." },
        { status: 502 }
      );
    }

    // 6. Store the returned NOWPayments invoice_id against the transaction record in database
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        providerReference: String(invoice.id),
      },
    });

    // 7. Return { checkoutUrl: invoice.invoice_url } to frontend
    return NextResponse.json({
      checkoutUrl: invoice.invoice_url,
      orderId: payment.id,
      invoiceId: invoice.id,
    });
  } catch (error: any) {
    console.error("Payment checkout route unhandled exception:", error);
    return NextResponse.json(
      { error: "Internal server error processing checkout." },
      { status: 500 }
    );
  }
}
