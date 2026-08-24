import { z } from "zod";

const serverEnvSchema = z.object({
  API_BASE_URL: z.string().url(),
  AUTH_COOKIE_NAME: z.string().min(1),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

const clientEnvSchema = z.object({
  NEXT_PUBLIC_API_BASE_URL: z.string().url(),
  NEXT_PUBLIC_APP_URL: z.string().url(),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;
export type ClientEnv = z.infer<typeof clientEnvSchema>;

let cachedServerEnv: ServerEnv | null = null;
let cachedClientEnv: ClientEnv | null = null;

export function getServerEnv(): ServerEnv {
  if (cachedServerEnv) return cachedServerEnv;
  const parsed = serverEnvSchema.safeParse({
    API_BASE_URL: process.env.API_BASE_URL,
    AUTH_COOKIE_NAME: process.env.AUTH_COOKIE_NAME,
    NODE_ENV: process.env.NODE_ENV,
  });
  if (!parsed.success) {
    console.error("Invalid server environment variables:", parsed.error.flatten().fieldErrors);
    throw new Error("Invalid server environment configuration");
  }
  cachedServerEnv = parsed.data;
  return cachedServerEnv;
}

export function getClientEnv(): ClientEnv {
  if (cachedClientEnv) return cachedClientEnv;
  const parsed = clientEnvSchema.safeParse({
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  });
  if (!parsed.success) {
    console.error("Invalid client environment variables:", parsed.error.flatten().fieldErrors);
    throw new Error("Invalid client environment configuration");
  }
  cachedClientEnv = parsed.data;
  return cachedClientEnv;
}