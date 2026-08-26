import 'dotenv/config';
import { z } from 'zod';

const boolSchema = z
  .string()
  .optional()
  .transform((v) => v === 'true' || v === '1');

const nonEmptyString = (msg: string) =>
  z
    .string()
    .transform((v) => (v.length > 0 ? v : undefined))
    .optional()
    .refine((v) => v === undefined || v.length > 0, { message: msg });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),

  CORS_ORIGINS: z
    .string()
    .optional()
    .transform((v) =>
      v
        ? v
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        : ['http://localhost:3000'],
    ),

  API_BASE_URL: z.string().default('http://localhost:4000'),
  CLIENT_BASE_URL: z.string().default('http://localhost:3000'),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  JWT_SECRET: z.string().min(1, 'JWT_SECRET is required'),
  JWT_EXPIRES_IN: z.string().default('7d'),

  STRIPE_SECRET_KEY: z.string().min(1, 'STRIPE_SECRET_KEY is required'),
  STRIPE_WEBHOOK_SECRET: nonEmptyString('STRIPE_WEBHOOK_SECRET is required'),
  STRIPE_CURRENCY: z.string().default('usd'),

  WHATSAPP_ACCESS_TOKEN: nonEmptyString('WHATSAPP_ACCESS_TOKEN is required'),
  WHATSAPP_PHONE_NUMBER_ID: nonEmptyString('WHATSAPP_PHONE_NUMBER_ID is required'),
  WHATSAPP_VERIFY_TOKEN: nonEmptyString('WHATSAPP_VERIFY_TOKEN is required'),
  WHATSAPP_APP_SECRET: nonEmptyString('WHATSAPP_APP_SECRET is required'),
  WHATSAPP_API_VERSION: z.string().default('v21.0'),

  JOB_DURATION_MINUTES: z.coerce.number().int().positive().default(60),
  TRAVEL_BUFFER_MINUTES: z.coerce.number().int().nonnegative().default(30),
  BOOKING_FEE: z.coerce.number().int().nonnegative().default(5000),
  APPLICATION_FEE: z.coerce.number().int().nonnegative().default(500),

  WORK_DAY_START: z.string().default('09:00'),
  WORK_DAY_END: z.string().default('17:00'),
  DEFAULT_TIMEZONE: z.string().default('UTC'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`);
  // eslint-disable-next-line no-console
  console.error('Invalid environment variables:');
  issues.forEach((issue) => console.error('  - ' + issue));
  throw new Error('Invalid environment configuration. See errors above.');
}

export const env = parsed.data;

export type Env = typeof env;