const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function removeUnauthorizedAccess() {
  console.log("=== EXECUTING CLEANUP OF UNAUTHORIZED STRIPE/SANDBOX SUBSCRIPTIONS ===");

  // Find system admin user for audit logging
  const admin = await prisma.user.findFirst({
    where: { role: 'ADMIN' },
  });

  if (!admin) {
    throw new Error("Admin user not found for audit logging.");
  }

  // Target list of users who gained Pro access via Stripe sandbox, manual override, or test mode without valid verified NOWPayments payments
  const targetEmails = [
    'tomkaranja57@gmail.com',
    'talha@gmail.com',
    'bambimim28@gmail.com',
    'ahmad@gmail.com',
    'qa-terminal@xauusdtracker.com',
    'test12@gmail.com',
    'java@gmail.com',
    'debug@gmail.com',
    'support@xauusdtracker.com',
    'josuuf.mo@gmail.com',
    'sedaka226@gmail.com',
  ];

  console.log(`Auditing and deactivating ${targetEmails.length} legacy/test accounts...\n`);

  for (const email of targetEmails) {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { subscription: true },
    });

    if (!user) {
      console.log(`User ${email} not found in database, skipping.`);
      continue;
    }

    if (user.subscription && user.subscription.status === 'ACTIVE') {
      console.log(`[DEACTIVATING] User ${email} (Current status: ACTIVE, Source: ${user.subscription.source}, PeriodEnd: ${user.subscription.currentPeriodEnd})`);

      await prisma.$transaction([
        prisma.subscription.update({
          where: { userId: user.id },
          data: {
            status: 'INACTIVE',
            currentPeriodEnd: null,
          },
        }),
        prisma.adminAuditEvent.create({
          data: {
            adminUserId: admin.id,
            targetUserId: user.id,
            action: 'DEACTIVATE_UNAUTHORIZED_ACCESS',
            reason: 'Removed legacy Stripe sandbox / developer test access without valid NOWPayments payment as requested by client.',
          },
        }),
      ]);

      console.log(`  -> Successfully deactivated ${email} and recorded audit trail.`);
    } else {
      console.log(`User ${email} is already INACTIVE.`);
    }
  }

  // Verify remaining active subscriptions
  const remainingActive = await prisma.subscription.findMany({
    where: { status: 'ACTIVE' },
    include: { user: true, plan: true },
  });

  console.log(`\n=== REMAINING ACTIVE SUBSCRIPTIONS AFTER CLEANUP (${remainingActive.length}) ===`);
  for (const sub of remainingActive) {
    console.log(`User: ${sub.user.email} (${sub.user.role}) | Plan: ${sub.plan?.name || sub.planId} | Source: ${sub.source} | End: ${sub.currentPeriodEnd}`);
  }

  console.log("\nCleanup successfully completed.");
}

removeUnauthorizedAccess()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
