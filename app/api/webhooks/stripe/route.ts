import { NextRequest } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";

export async function POST(req: NextRequest) {
  // CRITICAL: Read raw body as text string; never call req.json()
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return new Response("Missing stripe-signature header", { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET environment variable is missing.");
    return new Response("Webhook secret unconfigured", { status: 500 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Invalid signature";
    console.error(`Stripe Webhook Signature Verification Failed: ${message}`);
    return new Response(`Webhook Error: ${message}`, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const checkoutSession = event.data.object as Stripe.Checkout.Session;
        const customerId = checkoutSession.customer as string;
        const subscriptionId = checkoutSession.subscription as string;
        const userId = checkoutSession.metadata?.userId;

        if (subscriptionId) {
          const sub = await stripe.subscriptions.retrieve(subscriptionId);
          const periodEndSec =
            (sub as any).current_period_end ||
            Math.floor(Date.now() / 1000) + 30 * 86400;

          await prisma.subscription.updateMany({
            where: {
              OR: [
                ...(customerId ? [{ stripeCustomerId: customerId }] : []),
                ...(userId ? [{ userId }] : []),
              ],
            },
            data: {
              status: "ACTIVE",
              stripeCustomerId: customerId,
              stripeSubscriptionId: subscriptionId,
              currentPeriodEnd: new Date(periodEndSec * 1000),
            },
          });
        }
        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId =
          typeof sub.customer === "string" ? sub.customer : sub.customer.id;

        let status: "ACTIVE" | "INACTIVE" | "CANCELED" = "INACTIVE";
        if (sub.status === "active" || sub.status === "trialing") {
          status = "ACTIVE";
        } else if (sub.status === "canceled" || sub.status === "unpaid") {
          status = "CANCELED";
        } else {
          status = "INACTIVE";
        }

        const periodEndSec =
          (sub as any).current_period_end ||
          Math.floor(Date.now() / 1000) + 30 * 86400;

        await prisma.subscription.updateMany({
          where: {
            OR: [
              { stripeSubscriptionId: sub.id },
              ...(customerId ? [{ stripeCustomerId: customerId }] : []),
            ],
          },
          data: {
            status,
            stripeSubscriptionId: sub.id,
            currentPeriodEnd: new Date(periodEndSec * 1000),
          },
        });
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId =
          typeof sub.customer === "string" ? sub.customer : sub.customer.id;

        await prisma.subscription.updateMany({
          where: {
            OR: [
              { stripeSubscriptionId: sub.id },
              ...(customerId ? [{ stripeCustomerId: customerId }] : []),
            ],
          },
          data: {
            status: "CANCELED",
          },
        });
        break;
      }

      default:
        break;
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return new Response("Webhook processing failed", { status: 500 });
  }
}
