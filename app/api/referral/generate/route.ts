import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";

/**
 * POST /api/referral/generate
 * Generates or retrieves the referral code for the authenticated user.
 */
export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  const existing = await prisma.user.findUnique({
    where: { id: userId },
    select: { referralCode: true },
  });

  if (existing?.referralCode) {
    return NextResponse.json({ success: true, code: existing.referralCode });
  }

  // Generate a unique 8-character code
  let code: string = "";
  for (let i = 0; i < 10; i++) {
    const candidate = randomBytes(5).toString("hex").toUpperCase().slice(0, 8);
    const collision = await prisma.user.findUnique({
      where: { referralCode: candidate },
    });
    if (!collision) {
      code = candidate;
      break;
    }
  }

  if (!code) {
    return NextResponse.json({ error: "Failed to generate unique code" }, { status: 500 });
  }

  await prisma.user.update({
    where: { id: userId },
    data: { referralCode: code },
  });

  return NextResponse.json({ success: true, code });
}

