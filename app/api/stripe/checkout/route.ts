import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id || !session?.user?.email) {
      return NextResponse.json(
        { error: "Authentication required for checkout." },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const userEmail = session.user.email.toLowerCase().trim();

    // Look for existing subscription record
    let subscription = await prisma.subscription.findUnique({
      where: { userId },
    });

    let stripeCustomerId = subscription?.stripeCustomerId;

    // Fetch or create Stripe Customer
    if (!stripeCustomerId) {
      const existing = await stripe.customers.list({
        email: userEmail,
        limit: 1,
      });

      if (existing.data.length > 0) {
        stripeCustomerId = existing.data[0].id;
      } else {
        const customer = await stripe.customers.create({
          email: userEmail,
          metadata: {
            userId,
          },
        });
        stripeCustomerId = customer.id;
      }

      // Persist stripeCustomerId in database
      await prisma.subscription.upsert({
        where: { userId },
        create: {
          userId,
          stripeCustomerId,
          status: "INACTIVE",
        },
        update: {
          stripeCustomerId,
        },
      });
    }

    const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
    const proto = req.headers.get("x-forwarded-proto") || "https";
    const baseUrl = host
      ? `${proto}://${host}`
      : process.env.NEXTAUTH_URL && !process.env.NEXTAUTH_URL.includes("xauusdtracker.com")
      ? process.env.NEXTAUTH_URL
      : "http://localhost:3000";

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: stripeCustomerId,
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID!,
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/checkout/result?session=success`,
      cancel_url: `${baseUrl}/checkout/result?session=cancelled`,
      metadata: {
        userId,
      },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error("Stripe checkout session creation failed:", error);
    return NextResponse.json(
      { error: "Internal server error during checkout initialization." },
      { status: 500 }
    );
  }
}
