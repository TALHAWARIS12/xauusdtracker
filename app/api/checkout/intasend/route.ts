import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getPlanById } from "@/lib/plan-config";
import {
  createIntaSendCheckoutSession,
  formatIntaSendPhoneNumber,
  VERIFIED_LIVE_PUB_KEY,
} from "@/lib/intasend";

export async function POST(req: Request) {
  try {
    // 1. Parse request payload first so guest checkout email can be supported smoothly
    const body = await req.json().catch(() => ({}));
    const { planId, phoneNumber, email: rawGuestEmail } = body;

    // 2. Resolve user from active session OR checkout email
    const session = await auth();
    let userId = session?.user?.id;
    let userEmail = session?.user?.email;

    if (!userId || !userEmail) {
      const candidateEmail =
        typeof rawGuestEmail === "string"
          ? rawGuestEmail.trim().toLowerCase()
          : "";
      const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(candidateEmail);

      if (!isValidEmail) {
        return NextResponse.json(
          {
            error: "Please enter a valid email address or sign in to continue.",
          },
          { status: 401 }
        );
      }

      let existingUser = await prisma.user.findUnique({
        where: { email: candidateEmail },
      });

      if (!existingUser) {
        const tempHash = await bcrypt.hash(
          `xau_${Date.now()}_${Math.random()}`,
          10
        );
        existingUser = await prisma.user.create({
          data: {
            email: candidateEmail,
            passwordHash: tempHash,
            role: "USER",
            subscription: {
              create: { status: "INACTIVE" },
            },
          },
        });
      }

      userId = existingUser.id;
      userEmail = existingUser.email;
    }

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

    // 4. Determine app base URL (sanitized against surrounding quotes/slashes)
    const url = new URL(req.url);
    const rawAppUrl =
      process.env.NEXT_PUBLIC_APP_URL || `${url.protocol}//${url.host}`;
    const appUrl = rawAppUrl
      .trim()
      .replace(/^["']+|["']+$/g, "")
      .replace(/\/+$/, "");

    const validPhone =
      typeof phoneNumber === "string" &&
      !phoneNumber.includes("@") &&
      phoneNumber.replace(/\D/g, "").length >= 9
        ? formatIntaSendPhoneNumber(phoneNumber.trim())
        : undefined;

    // 5. Initialize IntaSend checkout session on server
    try {
      const intasendSession = await createIntaSendCheckoutSession({
        amountUsd: priceUsd,
        email: userEmail,
        phoneNumber: validPhone,
        apiRef: payment.id,
        redirectUrl: `${appUrl}/payment/status`,
      });

      if (intasendSession?.url) {
        if (intasendSession.id) {
          await prisma.payment
            .update({
              where: { id: payment.id },
              data: {
                providerReference: intasendSession.id,
              },
            })
            .catch(() => null);
        }

        return NextResponse.json({
          checkoutUrl: intasendSession.url,
          orderId: payment.id,
          checkoutId: intasendSession.id,
        });
      }
    } catch (apiError: any) {
      console.warn(
        "Server-side IntaSend initialization encountered error, activating direct browser fallback:",
        apiError?.message
      );
    }

    // 6. If server-side IP was blocked/500'd by Cloudflare/IntaSend, return clean parameters
    // so the user's browser can initialize the IntaSend checkout session directly.
    return NextResponse.json({
      checkoutUrl: null,
      clientFallback: true,
      orderId: payment.id,
      publishableKey: VERIFIED_LIVE_PUB_KEY,
      amountUsd: priceUsd,
      amountKes: Math.max(10, Math.round(priceUsd * 129)),
      email: userEmail,
      phoneNumber: validPhone || null,
      redirectUrl: "https://xauusdtracker.com/payment/status",
    });
  } catch (error: any) {
    console.error("IntaSend checkout route error:", error);
    return NextResponse.json(
      { error: "Internal server error processing IntaSend checkout." },
      { status: 500 }
    );
  }
}
