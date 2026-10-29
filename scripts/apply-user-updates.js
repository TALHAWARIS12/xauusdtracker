const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  console.log("=== APPLYING USER ACCOUNT UPDATES ===");

  const oneYearFromNow = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

  // 1. Reset password for support@xauusdtracker.com -> support1234@
  const supportEmail = 'support@xauusdtracker.com';
  const supportHash = await bcrypt.hash('support1234@', 10);
  
  const supportUser = await prisma.user.upsert({
    where: { email: supportEmail },
    create: {
      email: supportEmail,
      passwordHash: supportHash,
      role: 'ADMIN',
      subscription: {
        create: {
          planId: 'yearly',
          status: 'ACTIVE',
          source: 'MANUAL_OVERRIDE',
          currentPeriodEnd: oneYearFromNow,
        }
      }
    },
    update: {
      passwordHash: supportHash,
      role: 'ADMIN',
    },
    include: { subscription: true }
  });

  // Ensure support subscription is active yearly
  await prisma.subscription.upsert({
    where: { userId: supportUser.id },
    create: {
      userId: supportUser.id,
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
    }
  });

  console.log(`[UPDATED] ${supportEmail}: Password reset to "support1234@" | Role: ADMIN | Subscription: ACTIVE (Yearly)`);

  // 2. Give yearly access to abrahamgbeku9@gmail.com
  const abrahamEmail = 'abrahamgbeku9@gmail.com';
  let abraham = await prisma.user.findUnique({
    where: { email: abrahamEmail },
    include: { subscription: true }
  });

  const abrahamDefaultPassword = 'Abraham1234@';
  if (!abraham) {
    const abrahamHash = await bcrypt.hash(abrahamDefaultPassword, 10);
    abraham = await prisma.user.create({
      data: {
        email: abrahamEmail,
        passwordHash: abrahamHash,
        role: 'USER',
        subscription: {
          create: {
            planId: 'yearly',
            status: 'ACTIVE',
            source: 'MANUAL_OVERRIDE',
            currentPeriodEnd: oneYearFromNow,
          }
        }
      },
      include: { subscription: true }
    });
    console.log(`[CREATED] ${abrahamEmail}: User created with initial password "${abrahamDefaultPassword}" and 365-day Yearly Pro access.`);
  } else {
    await prisma.subscription.upsert({
      where: { userId: abraham.id },
      create: {
        userId: abraham.id,
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
      }
    });
    console.log(`[UPDATED] ${abrahamEmail}: Existing account updated with 365-day Yearly Pro access.`);
  }

  // 3. Create admin account admin@admin.com with password admin1234@
  const newAdminEmail = 'admin@admin.com';
  const newAdminPassword = 'admin1234@';
  const newAdminHash = await bcrypt.hash(newAdminPassword, 10);

  const newAdmin = await prisma.user.upsert({
    where: { email: newAdminEmail },
    create: {
      email: newAdminEmail,
      passwordHash: newAdminHash,
      role: 'ADMIN',
      subscription: {
        create: {
          planId: 'yearly',
          status: 'ACTIVE',
          source: 'MANUAL_OVERRIDE',
          currentPeriodEnd: oneYearFromNow,
        }
      }
    },
    update: {
      passwordHash: newAdminHash,
      role: 'ADMIN',
    },
    include: { subscription: true }
  });

  await prisma.subscription.upsert({
    where: { userId: newAdmin.id },
    create: {
      userId: newAdmin.id,
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
    }
  });

  console.log(`[CREATED/UPDATED] ${newAdminEmail}: Role: ADMIN | Password: "${newAdminPassword}" | Subscription: ACTIVE (Yearly)`);

  // Record Admin Audit Event
  await prisma.adminAuditEvent.create({
    data: {
      adminUserId: newAdmin.id,
      targetUserId: newAdmin.id,
      action: 'SYSTEM_ACCOUNTS_PROVISIONED',
      reason: 'Reset support passkey, granted yearly access to abrahamgbeku9@gmail.com, and provisioned admin@admin.com.',
    }
  });

  console.log("\n=== ALL ACCOUNT OPERATIONS COMPLETED SUCCESSFULLY ===");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
