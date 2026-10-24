import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get("order_id") || searchParams.get("orderId");

    if (!orderId) {
      return NextResponse.json(
        { error: "Query parameter 'order_id' is required." },
        { status: 400 }
      );
    }

    const transaction = await prisma.payment.findFirst({
      where: {
        OR: [
          { id: String(orderId) },
          { providerReference: String(orderId) },
        ],
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            subscription: {
              select: {
                status: true,
                currentPeriodEnd: true,
              },
            },
          },
        },
      },
    });

    if (!transaction) {
      return NextResponse.json(
        { found: false, error: "Transaction not found." },
        { status: 404 }
      );
    }

    const isSubscribed =
      transaction.user.subscription?.status === "ACTIVE" &&
      (!transaction.user.subscription?.currentPeriodEnd ||
        transaction.user.subscription.currentPeriodEnd.getTime() > Date.now());

    return NextResponse.json({
      found: true,
      orderId: transaction.id,
      status: transaction.status,
      provider: transaction.provider,
      amount: transaction.amount,
      currency: transaction.currency,
      confirmedAt: transaction.confirmedAt?.toISOString() || null,
      createdAt: transaction.createdAt.toISOString(),
      isSubscribed,
    });
  } catch (error: any) {
    console.error("Payment status query error:", error);
    return NextResponse.json(
      { error: "Internal error querying payment status." },
      { status: 500 }
    );
  }
}
