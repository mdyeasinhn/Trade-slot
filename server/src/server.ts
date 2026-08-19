import { env } from './config/env';
import { createApp } from './app';
import { prisma } from './lib/prisma';

const app = createApp();

async function main() {
  const port = env.PORT;
  await prisma.$connect();
  app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`TradeSlot API listening on http://localhost:${port}`);
  });
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Failed to start server:', err);
  process.exit(1);
});