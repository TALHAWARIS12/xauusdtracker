import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getPlanById } from "@/lib/plan-config";
import { createIntaSendCheckoutSession } from "@/lib/intasend";

export async function POST(req: Request) {
  try {
    // 1. Parse request payload first so guest checkout email can be supported smoothly
    const body = await req.json().catch(() => ({}));
    const { planId, phoneNumber, email: rawGuestEmail, method } = body;

    // 2. Resolve user from active session OR checkout email
    const session = await auth();
    let userId = session?.user?.id;
    let userEmail = session?.user?.email;

    if (!userId || !userEmail) {
      const candidateEmail =
        typeof rawGuestEmail === "string" ? rawGuestEmail.trim().toLowerCase() : "";
      const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(candidateEmail);

      if (!isValidEmail) {
        return NextResponse.json(
          { error: "Please enter a valid email address or sign in to continue." },
          { status: 401 }
        );
      }

      let existingUser = await prisma.user.findUnique({
        where: { email: candidateEmail },
      });

      if (!existingUser) {
        const tempHash = await bcrypt.hash(`xau_${Date.now()}_${Math.random()}`, 10);
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
      process.env.NEXT_PUBLIC_APP_URL ||
      `${url.protocol}//${url.host}`;
    const appUrl = rawAppUrl.trim().replace(/^["']|["']$/g, "").replace(/\/+$/, "");

    // 5. Initialize IntaSend checkout session
    let intasendSession;
    try {
      // Sanitize phone number (ignore if email or non-digit was entered by accident)
      const validPhone =
        typeof phoneNumber === "string" &&
        !phoneNumber.includes("@") &&
        phoneNumber.replace(/\D/g, "").length >= 9
          ? phoneNumber.trim()
          : undefined;

      intasendSession = await createIntaSendCheckoutSession({
        amountUsd: priceUsd,
        email: userEmail,
        phoneNumber: validPhone,
        apiRef: payment.id,
        redirectUrl: `${appUrl}/payment/status`,
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

