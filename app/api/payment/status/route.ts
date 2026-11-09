import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyIntaSendPayment } from "@/lib/intasend";
import { activateSuccessfulPayment } from "@/lib/payment-activation";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const orderId =
      searchParams.get("order_id") ||
      searchParams.get("orderId") ||
      searchParams.get("checkout_id") ||
      searchParams.get("checkoutId") ||
      searchParams.get("id");

    const invoiceId =
      searchParams.get("invoice_id") ||
      searchParams.get("invoiceId");

    if (!orderId && !invoiceId) {
      return NextResponse.json(
        { error: "Query parameter 'order_id' is required." },
        { status: 400 }
      );
    }

    const searchConditions: any[] = [];
    if (orderId) {
      searchConditions.push({ id: String(orderId) });
      searchConditions.push({ providerReference: String(orderId) });
    }
    if (invoiceId) {
      searchConditions.push({ providerReference: String(invoiceId) });
    }

    let transaction = await prisma.payment.findFirst({
      where: {
        OR: searchConditions,
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

    // Active verification on return redirect for IntaSend
    if (transaction.status === "PENDING" && transaction.provider === "INTASEND") {
      const targetInvoice = invoiceId || transaction.providerReference;
      if (targetInvoice) {
        try {
          const verified = await verifyIntaSendPayment({
            invoice_id: String(targetInvoice),
            checkout_id: transaction.providerReference || undefined,
          });

          if (verified?.state === "COMPLETE") {
            await activateSuccessfulPayment(transaction.id, String(targetInvoice));
            const updated = await prisma.payment.findUnique({
              where: { id: transaction.id },
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
            if (updated) {
              transaction = updated;
            }
          }
        } catch (pollErr) {
          console.warn("IntaSend active polling lookup check warning:", pollErr);
        }
      }
    }

    const isSubscribed =
      transaction.user?.subscription?.status === "ACTIVE" &&
      (!transaction.user?.subscription?.currentPeriodEnd ||
        transaction.user.subscription.currentPeriodEnd.getTime() > Date.now());

    const createdAtStr = transaction.createdAt
      ? typeof transaction.createdAt.toISOString === "function"
        ? transaction.createdAt.toISOString()
        : String(transaction.createdAt)
      : new Date().toISOString();

    const confirmedAtStr = transaction.confirmedAt
      ? typeof transaction.confirmedAt.toISOString === "function"
        ? transaction.confirmedAt.toISOString()
        : String(transaction.confirmedAt)
      : null;

    return NextResponse.json({
      found: true,
      orderId: transaction.id,
      status: transaction.status,
      provider: transaction.provider,
      amount: transaction.amount,
      currency: transaction.currency,
      confirmedAt: confirmedAtStr,
      createdAt: createdAtStr,
      isSubscribed: Boolean(isSubscribed),
    });
  } catch (error: any) {
    console.error("Payment status query error:", error);
    return NextResponse.json(
      { error: "Internal error querying payment status." },
      { status: 500 }
    );
  }
}
