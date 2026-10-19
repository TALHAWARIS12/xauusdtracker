const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const mode = process.argv[2] || "inactive";
  const user = await prisma.user.findUnique({
    where: { email: "qa-terminal@xauusdtracker.com" },
  });

  if (!user) {
    console.error("User not found");
    return;
  }

  if (mode === "active") {
    const future = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await prisma.subscription.upsert({
      where: { userId: user.id },
      create: { userId: user.id, status: "ACTIVE", currentPeriodEnd: future },
      update: { status: "ACTIVE", currentPeriodEnd: future },
    });
    console.log("Subscription status set to ACTIVE");
  } else {
    await prisma.subscription.upsert({
      where: { userId: user.id },
      create: { userId: user.id, status: "INACTIVE", currentPeriodEnd: null },
      update: { status: "INACTIVE", currentPeriodEnd: null },
    });
    console.log("Subscription status set to INACTIVE");
  }

  await prisma.$disconnect();
}

main().catch(console.error);
