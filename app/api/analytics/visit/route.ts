import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const path = typeof body.path === "string" ? body.path.slice(0, 200) : "/";
    const referrer = typeof body.referrer === "string" ? body.referrer.slice(0, 500) : null;

    const userAgent = req.headers.get("user-agent")?.slice(0, 500) || null;
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "127.0.0.1";

    // Privacy-preserving hash (16-char)
    const ipHash = crypto
      .createHash("sha256")
      .update(ip + (process.env.AUTH_SECRET || "salt"))
      .digest("hex")
      .slice(0, 16);

    await prisma.siteVisit.create({
      data: {
        path,
        referrer,
        userAgent,
        ipHash,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    // Non-blocking for client experience
    return NextResponse.json({ success: false }, { status: 200 });
  }
}
