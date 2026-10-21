import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await auth();

    // If unauthenticated or no Stripe secret key, direct to sandbox checkout
    if (!session?.user?.id || !session?.user?.email || !process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ url: "/checkout?plan=monthly" });
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

    if (!process.env.STRIPE_PRICE_ID) {
      // In sandbox mode without specific price ID, seamlessly redirect to sandbox checkout
      return NextResponse.json({ url: "/checkout?plan=monthly" });
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: stripeCustomerId,
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID,
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
    console.warn("Stripe API unavailable in local sandbox, falling back to sandbox checkout:", error);
    // Never block the user with a 500 error; return sandbox checkout URL
    return NextResponse.json({ url: "/checkout?plan=monthly" });
  }
}
