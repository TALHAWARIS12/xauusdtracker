import { NextResponse } from "next/server";

/**
 * Stripe payments have been deprecated and removed.
 * Checkout is handled exclusively through NOWPayments cryptocurrency gateway.
 * Redirects any legacy calls directly to the crypto checkout page.
 */
export async function POST() {
  return NextResponse.json({ url: "/checkout?plan=monthly" });
}

export async function GET() {
  return NextResponse.redirect(new URL("/checkout?plan=monthly", "https://xauusdtracker.com"));
}
