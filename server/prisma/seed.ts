import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';
import 'dotenv/config';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

/**
 * MVP seed: one business + one trader with a work area for today and
 * tomorrow. Idempotent — run via `npm run db:seed`.
 */
async function main() {
  const email = 'demo@tradeslot.dev';
  const password = 'password123';

  const business = await prisma.business.upsert({
    where: { id: 'seed-business-1' },
    update: {},
    create: { id: 'seed-business-1', name: 'Demo Business' },
  });

  const trader = await prisma.trader.upsert({
    where: { id: 'seed-trader-1' },
    update: { businessId: business.id },
    create: {
      id: 'seed-trader-1',
      businessId: business.id,
      name: 'Demo Trader',
      phone: '+15551234567',
      timezone: 'UTC',
    },
  });

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (!existingUser) {
    await prisma.user.create({
      data: {
        email,
        name: 'Demo Trader',
        passwordHash: await bcrypt.hash(password, 10),
        role: 'TRADER',
        trader: { connect: { id: trader.id } },
      },
    });
  }

  // Work areas for today and tomorrow (UTC midnight).
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

  for (const date of [today, tomorrow]) {
    await prisma.workArea.upsert({
      where: { traderId_date: { traderId: trader.id, date } },
      update: {},
      create: { traderId: trader.id, date, area: 'Downtown' },
    });
  }

  // eslint-disable-next-line no-console
  console.log(`Seeded business ${business.id} and trader ${trader.id}`);
}

main()
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());