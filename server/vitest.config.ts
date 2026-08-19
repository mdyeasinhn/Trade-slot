import { defineConfig } from 'vitest/config';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env') });

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    // A single bake-in DB is fine for integration tests; files share the pool.
    pool: 'forks',
    testTimeout: 20000,
    hookTimeout: 30000,
  },
});