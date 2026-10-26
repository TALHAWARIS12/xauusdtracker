import { NextResponse } from "next/server";

/**
 * Stripe payments have been replaced with NOWPayments cryptocurrency gateway.
 * Stripe webhook handler safely acknowledges any lingering legacy events.
 */
export async function POST() {
  return NextResponse.json({
    received: true,
    message: "Stripe webhooks are deprecated. Active payments use NOWPayments crypto gateway.",
  });
}
