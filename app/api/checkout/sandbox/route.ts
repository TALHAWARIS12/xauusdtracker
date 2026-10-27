import { NextResponse } from "next/server";

/**
 * Sandbox checkout is permanently deprecated and disabled.
 * All subscription activations require genuine, verified NOWPayments IPN ledger confirmations.
 */
export async function POST() {
  return NextResponse.json(
    { error: "Sandbox checkout has been permanently disabled. All transactions require official payment gateway processing." },
    { status: 403 }
  );
}

export async function GET() {
  return NextResponse.json(
    { error: "Sandbox checkout has been permanently disabled." },
    { status: 403 }
  );
}
