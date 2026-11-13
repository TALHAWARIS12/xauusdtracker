import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getPlanById } from "@/lib/plan-config";

const PAYBILL_NUMBER = "919700";
const ACCOUNT_NUMBER = "0018255401";
const SUPPORT_EMAIL = "Support@xauusdtracker.com";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const {
      planId,
      email: rawGuestEmail,
      mpesaCode: rawMpesaCode,
      phoneNumber: rawPhoneNumber,
    } = body;

    // 1. Resolve authenticated session OR smooth checkout email
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
            error:
              "Please enter a valid email address so we can activate Pro access on your account once approved.",
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

    // 2. Normalize optional M-Pesa confirmation code and phone number
    const cleanCode =
      typeof rawMpesaCode === "string"
        ? rawMpesaCode.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "").slice(0, 32)
        : "";
    const cleanPhone =
      typeof rawPhoneNumber === "string" && !rawPhoneNumber.includes("@")
        ? rawPhoneNumber.trim().replace(/[^\d+]/g, "").slice(0, 20)
        : "";

    const uniqueSuffix = Math.random().toString(36).slice(2, 7).toUpperCase();
    const baseRef = cleanCode
      ? cleanPhone
        ? `${cleanCode} (${cleanPhone})`
        : cleanCode
      : cleanPhone
      ? `PB-${cleanPhone}-${uniqueSuffix}`
      : `PB-${Date.now().toString(36).toUpperCase()}-${uniqueSuffix}`;

    // Check if an identical reference already exists to avoid unique constraint errors
    let finalReference = baseRef;
    if (cleanCode) {
      const existingPayment = await prisma.payment.findUnique({
        where: { providerReference: finalReference },
      });
      if (existingPayment) {
        if (existingPayment.status === "COMPLETED") {
          return NextResponse.json(
            {
              error:
                "This M-Pesa confirmation code has already been verified and activated.",
            },
            { status: 409 }
          );
        }
        // Append short suffix if another pending attempt used the same string
        finalReference = `${baseRef} #${uniqueSuffix}`;
      }
    }

    // 3. Create PENDING PAYBILL payment record in DB for Admin verification
    const payment = await prisma.payment.create({
      data: {
        userId,
        provider: "PAYBILL",
        providerReference: finalReference,
        amount: priceUsd,
        currency: "USD",
        status: "PENDING",
      },
    });

    const amountKes = Math.round(priceUsd * 129);

    return NextResponse.json({
      success: true,
      orderId: payment.id,
      reference: payment.providerReference,
      email: userEmail,
      planId: configPlan.id,
      planName: configPlan.name,
      intervalLabel: configPlan.intervalLabel,
      amountUsd: priceUsd,
      amountKes,
      paybillNumber: PAYBILL_NUMBER,
      accountNumber: ACCOUNT_NUMBER,
      supportEmail: SUPPORT_EMAIL,
    });
  } catch (error: any) {
    console.error("Paybill checkout submission error:", error);
    return NextResponse.json(
      { error: "Unable to record your Paybill submission. Please try again." },
      { status: 500 }
    );
  }
}

