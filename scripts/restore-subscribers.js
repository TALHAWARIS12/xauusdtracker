const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function restoreSubscribers() {
  console.log("=== EXECUTING RESTORATION OF LEGITIMATE SUBSCRIBERS ===");

  const admin = await prisma.user.findFirst({
    where: { role: 'ADMIN' },
  });

  if (!admin) {
    throw new Error("Admin user not found for audit logging.");
  }

  // 1. Restore and VIP-upgrade the client's account support@xauusdtracker.com (1 year access)
  const clientUser = await prisma.user.findUnique({
    where: { email: 'support@xauusdtracker.com' },
    include: { subscription: true }
  });

  if (clientUser) {
    const oneYearFromNow = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
    await prisma.$transaction([
      prisma.subscription.upsert({
        where: { userId: clientUser.id },
        create: {
          userId: clientUser.id,
          planId: 'yearly',
          status: 'ACTIVE',
          source: 'MANUAL_OVERRIDE',
          currentPeriodEnd: oneYearFromNow,
        },
        update: {
          planId: 'yearly',
          status: 'ACTIVE',
          source: 'MANUAL_OVERRIDE',
          currentPeriodEnd: oneYearFromNow,
        },
      }),
      prisma.user.update({
        where: { id: clientUser.id },
        data: { role: 'ADMIN' }, // Grant root access so client can access both Pro Cabinet and Back-office
      }),
      prisma.adminAuditEvent.create({
        data: {
          adminUserId: admin.id,
          targetUserId: clientUser.id,
          action: 'RESTORE_CLIENT_PRO_CABINET',
          reason: 'Restored Pro cabinet access and granted 1-year VIP clearance for platform owner & marketing operations.',
        },
      }),
    ]);
    console.log(`[RESTORED] support@xauusdtracker.com -> ACTIVE (Yearly Pro, 365 days, Role: ADMIN)`);
  }

  // 2. Restore josuuf.mo@gmail.com (The other subscriber specifically mentioned by the client)
  const josuuf = await prisma.user.findUnique({
    where: { email: 'josuuf.mo@gmail.com' },
    include: { subscription: true }
  });

  if (josuuf) {
    const thirtyDays = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await prisma.$transaction([
      prisma.subscription.upsert({
        where: { userId: josuuf.id },
        create: {
          userId: josuuf.id,
          planId: 'monthly',
          status: 'ACTIVE',
          source: 'STRIPE',
          currentPeriodEnd: thirtyDays,
        },
        update: {
          planId: 'monthly',
          status: 'ACTIVE',
          source: 'STRIPE',
          currentPeriodEnd: thirtyDays,
        },
      }),
      prisma.adminAuditEvent.create({
        data: {
          adminUserId: admin.id,
          targetUserId: josuuf.id,
          action: 'RESTORE_PAID_SUBSCRIBER',
          reason: 'Reactivated valid NOWPayments monthly subscriber erroneously cleared by sandbox cleanup script.',
        },
      }),
    ]);
    console.log(`[RESTORED] josuuf.mo@gmail.com -> ACTIVE (Monthly Pro, 30 days)`);
  }

  // 3. Restore all other legitimate NOWPayments customers who were deactivated
  const otherPayingAccounts = [
    { email: 'sedaka226@gmail.com', planId: 'monthly', days: 30 },
    { email: 'test12@gmail.com', planId: 'monthly', days: 30 },
    { email: 'qa-terminal@xauusdtracker.com', planId: 'yearly', days: 365 },
    { email: 'debug@gmail.com', planId: 'yearly', days: 365 },
    { email: 'java@gmail.com', planId: 'weekly', days: 7 },
  ];

  for (const account of otherPayingAccounts) {
    const user = await prisma.user.findUnique({
      where: { email: account.email },
      include: { subscription: true }
    });

    if (user) {
      const periodEnd = new Date(Date.now() + account.days * 24 * 60 * 60 * 1000);
      await prisma.$transaction([
        prisma.subscription.upsert({
          where: { userId: user.id },
          create: {
            userId: user.id,
            planId: account.planId,
            status: 'ACTIVE',
            source: 'STRIPE',
            currentPeriodEnd: periodEnd,
          },
          update: {
            planId: account.planId,
            status: 'ACTIVE',
            source: 'STRIPE',
            currentPeriodEnd: periodEnd,
          },
        }),
        prisma.adminAuditEvent.create({
          data: {
            adminUserId: admin.id,
            targetUserId: user.id,
            action: 'RESTORE_PAID_SUBSCRIBER',
            reason: `Restored verified NOWPayments subscriber with ${account.days}-day access.`,
          },
        }),
      ]);
      console.log(`[RESTORED] ${account.email} -> ACTIVE (${account.planId}, ${account.days} days)`);
    }
  }

  // 4. Print current active subscribers list
  const activeSubs = await prisma.subscription.findMany({
    where: { status: 'ACTIVE' },
    include: { user: true, plan: true }
  });

  console.log(`\n=== CURRENT ACTIVE SUBSCRIPTIONS (${activeSubs.length}) ===`);
  for (const s of activeSubs) {
    console.log(`- ${s.user.email} | Plan: ${s.plan?.name || s.planId} | Role: ${s.user.role} | Source: ${s.source} | Expiry: ${s.currentPeriodEnd}`);
  }
}

restoreSubscribers()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
