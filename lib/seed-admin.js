const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, role: true },
  });
  console.log("Current users:", users);

  let admin = await prisma.user.findUnique({
    where: { email: "admin@xauusdtracker.com" },
  });

  if (!admin) {
    const passwordHash = await bcrypt.hash("AdminPass123!", 10);
    admin = await prisma.user.create({
      data: {
        email: "admin@xauusdtracker.com",
        passwordHash,
        role: "ADMIN",
        subscription: {
          create: {
            status: "ACTIVE",
            currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          },
        },
      },
    });
    console.log("Created admin account: admin@xauusdtracker.com / AdminPass123!");
  } else {
    if (admin.role !== "ADMIN") {
      await prisma.user.update({
        where: { email: "admin@xauusdtracker.com" },
        data: { role: "ADMIN" },
      });
      console.log("Updated admin account role to ADMIN");
    } else {
      console.log("Admin account is ready.");
    }
  }

  await prisma.$disconnect();
}

main().catch(console.error);
