import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { prisma } from '../src/lib/prisma';

export interface Fixture {
  traderId: string;
  businessId: string;
}

async function dbAvailable(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

/**
 * Run an integration suite only when a PostgreSQL server is reachable
 * (skips with a clear message locally when no DB is running).
 */
export async function describeDb(scope: string, fn: (fixture: () => Fixture) => void) {
  const dbUp = await dbAvailable();
  describe.skipIf(!dbUp)(scope, () => {
    let fixture: Fixture;

    beforeAll(async () => {
      const now = Date.now();
      const business = await prisma.business.create({
        data: { name: `Test Business ${scope} ${now}` },
      });
      const trader = await prisma.trader.create({
        data: {
          businessId: business.id,
          name: `Test Trader ${scope}`,
          timezone: 'UTC',
          workDayStart: '09:00',
          workDayEnd: '17:00',
          jobDurationMin: 60,
          bufferMin: 30,
          bookingFee: 5000,
          stripeAccountId: 'acct_test',
          stripeOnboardingDone: true,
          whatsappPhoneNumberId: 'test-phone-id',
        },
      });
      fixture = { traderId: trader.id, businessId: business.id };
    });

    afterAll(async () => {
      if (!fixture) return;
      await prisma.booking.deleteMany({ where: { traderId: fixture.traderId } });
      await prisma.workArea.deleteMany({ where: { traderId: fixture.traderId } });
      await prisma.message.deleteMany({ where: { conversation: { traderId: fixture.traderId } } });
      await prisma.conversation.deleteMany({ where: { traderId: fixture.traderId } });
      await prisma.trader.deleteMany({ where: { id: fixture.traderId } });
      await prisma.business.deleteMany({ where: { id: fixture.businessId } });
    });

    fn(memo(() => fixture));
  });
}

function memo<T>(get: () => T): () => T {
  let cached: T | undefined;
  return () => {
    if (cached === undefined) cached = get();
    return cached;
  };
}

export { prisma, expect, it };