const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // 1. Seed Plans
  const corePlans = [
    {
      id: "monthly",
      name: "Monthly Pro",
      priceUsd: 48.0,
      billingInterval: "month",
      features: [
        "Full zero-delay market telemetry",
        "Real-time buyer & seller liquidation pools",
        "Multi-timeframe candlestick analysis (1M/5M/15M)",
        "High-probability trade setup alerts",
        "Complete market volume analytics & delta",
        "Priority customer support",
      ],
      active: true,
    },
    {
      id: "yearly",
      name: "Yearly Pro",
      priceUsd: 188.0,
      billingInterval: "year",
      features: [
        "Everything in Monthly Pro",
        "67% savings compared to standard monthly pricing",
        "Full 365 days of continuous Pro access",
        "VIP feature access & future AI model updates",
        "Direct analyst support channel",
      ],
      active: true,
    },
    {
      id: "weekly",
      name: "Weekly Pass",
      priceUsd: 10.0,
      billingInterval: "week",
      features: [
        "Full zero-delay market telemetry",
        "High-probability trade setup alerts",
        "Weekly pass access",
      ],
      active: true,
    },
    {
      id: "daily",
      name: "Daily Pass",
      priceUsd: 5.0,
      billingInterval: "day",
      features: [
        "Full zero-delay market telemetry",
        "Daily pass access",
      ],
      active: true,
    },
  ];

  for (const cp of corePlans) {
    await prisma.plan.upsert({
      where: { id: cp.id },
      create: cp,
      update: {
        name: cp.name,
        priceUsd: cp.priceUsd,
        billingInterval: cp.billingInterval,
        features: cp.features,
        active: cp.active,
      },
    });
  }

  const plan = await prisma.plan.upsert({
    where: { name: "Institutional Gold Terminal Access" },
    create: {
      name: "Institutional Gold Terminal Access",
      priceUsd: 99.0,
      billingInterval: "month",
      features: [
        "Real-Time XAU/USD Stop-Loss & Take-Profit Concentration Pools",
        "Fibonacci 0.618 Dynamic Liquidity Zones Overlay",
        "Algorithmic Trend, Momentum & Volatility Regime Analysis",
        "Automated Rule-Based Trade Setup Engine with R:R Validation",
        "Interactive Risk / Reward & Position Sizing Calculator",
        "Full Order Flow Volume Depth & Retail Bias Tracking",
      ],
      active: true,
    },
    update: {
      priceUsd: 99.0,
      billingInterval: "month",
      active: true,
    },
  });
  console.log("Seeded all pricing plans and default plan:", plan.name);

  // 2. Seed Admin Account
  const adminPasswordHash = await bcrypt.hash("AdminPass123!", 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@xauusdtracker.com" },
    create: {
      email: "admin@xauusdtracker.com",
      passwordHash: adminPasswordHash,
      role: "ADMIN",
      subscription: {
        create: {
          planId: plan.id,
          status: "ACTIVE",
          source: "MANUAL_OVERRIDE",
          currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        },
      },
    },
    update: {
      role: "ADMIN",
      passwordHash: adminPasswordHash,
    },
    include: { subscription: true },
  });
  console.log("Seeded admin account:", admin.email);

  // 3. Seed QA Terminal Test Account
  const userPasswordHash = await bcrypt.hash("Password123!", 10);
  const qaUser = await prisma.user.upsert({
    where: { email: "qa-terminal@xauusdtracker.com" },
    create: {
      email: "qa-terminal@xauusdtracker.com",
      passwordHash: userPasswordHash,
      role: "USER",
      subscription: {
        create: {
          planId: plan.id,
          status: "INACTIVE",
          source: "STRIPE",
        },
      },
    },
    update: {
      passwordHash: userPasswordHash,
      role: "USER",
    },
  });
  console.log("Seeded QA user account:", qaUser.email);

  // 4. Seed initial Trade Setup snapshot for historical view
  const existingSetups = await prisma.tradeSetup.count();
  if (existingSetups === 0) {
    await prisma.tradeSetup.create({
      data: {
        symbol: "XAUUSD",
        timeframe: "1M",
        direction: "BULLISH",
        entryMin: 2712.5,
        entryMax: 2715.0,
        stopLoss: 2704.2,
        takeProfit: 2732.1,
        riskReward: 2.37,
        score: 88,
        rationale: "Bullish EMA 20/50 alignment above VWAP with RSI rebound from 45 and expanding ATR volatility.",
        status: "ACTIVE",
      },
    });
    console.log("Seeded initial trade setup snapshot");
  }

  // 5. Seed initial AdminAuditEvent for traceability
  const existingAudits = await prisma.adminAuditEvent.count();
  if (existingAudits === 0) {
    await prisma.adminAuditEvent.create({
      data: {
        adminUserId: admin.id,
        targetUserId: admin.id,
        action: "INITIAL_PROVISION",
        reason: "Root system installation and admin terminal provisioning.",
      },
    });
    console.log("Seeded initial admin audit event");
  }

  console.log("Database seed complete!");
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("Seeding error:", err);
  process.exit(1);
});
