const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2];
  const newPassword = process.argv[3];

  if (!email) {
    console.log("Usage: node scripts/set-user-password.js <email> [newPassword]");
    process.exit(1);
  }

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
  });

  if (!user) {
    console.error(`User with email "${email}" not found.`);
    process.exit(1);
  }

  const passwordToSet = newPassword || `GoldPass-${Math.random().toString(36).substring(2, 8).toUpperCase()}!`;
  const passwordHash = await bcrypt.hash(passwordToSet, 10);

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash },
  });

  console.log(`\n========================================`);
  console.log(`SUCCESS: Passkey updated for ${user.email}`);
  console.log(`New Password: ${passwordToSet}`);
  console.log(`========================================\n`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
