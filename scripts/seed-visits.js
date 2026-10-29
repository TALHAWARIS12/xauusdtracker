const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const count = await prisma.siteVisit.count();
  if (count === 0) {
    const sampleVisits = [
      { path: '/', referrer: 'https://google.com', ipHash: 'a1b2c3d4e5f6g7h8', createdAt: new Date(Date.now() - 3600000 * 24) },
      { path: '/pricing', referrer: 'https://google.com', ipHash: 'a1b2c3d4e5f6g7h8', createdAt: new Date(Date.now() - 3600000 * 20) },
      { path: '/dashboard', referrer: null, ipHash: 'b2c3d4e5f6g7h8i9', createdAt: new Date(Date.now() - 3600000 * 15) },
      { path: '/', referrer: 'https://t.me/xauusd_signals', ipHash: 'c3d4e5f6g7h8i9j0', createdAt: new Date(Date.now() - 3600000 * 8) },
      { path: '/checkout', referrer: 'https://xauusdtracker.com/pricing', ipHash: 'c3d4e5f6g7h8i9j0', createdAt: new Date(Date.now() - 3600000 * 7) },
      { path: '/', referrer: 'direct', ipHash: 'd4e5f6g7h8i9j0k1', createdAt: new Date(Date.now() - 3600000 * 4) },
      { path: '/pricing', referrer: 'https://instagram.com', ipHash: 'e5f6g7h8i9j0k1l2', createdAt: new Date(Date.now() - 3600000 * 2) },
      { path: '/dashboard', referrer: 'https://xauusdtracker.com/', ipHash: 'f6g7h8i9j0k1l2m3', createdAt: new Date(Date.now() - 3600000 * 1) },
      { path: '/', referrer: 'direct', ipHash: 'f6g7h8i9j0k1l2m3', createdAt: new Date(Date.now() - 1800000) },
      { path: '/pricing', referrer: 'direct', ipHash: 'g7h8i9j0k1l2m3n4', createdAt: new Date(Date.now() - 600000) },
    ];
    for (const v of sampleVisits) {
      await prisma.siteVisit.create({ data: v });
    }
    console.log(`Seeded ${sampleVisits.length} initial baseline visits.`);
  } else {
    console.log(`SiteVisit already has ${count} records.`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
