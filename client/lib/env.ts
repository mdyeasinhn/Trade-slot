import { z } from "zod";

/**
 * Environment validation (AGENTS.md §13). Server and browser vars are parsed by
 * separate schemas so a missing server-only secret can never be surfaced to the
 * client bundle. `NEXT_PUBLIC_*` values are inlined at build time, so they are
 * read as literal property accesses rather than through a dynamic index.
 */

const serverEnvSchema = z.object({
  API_BASE_URL: z.string().url(),
  AUTH_COOKIE_NAME: z.string().min(1).default("tradeslot_session"),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

const clientEnvSchema = z.object({
  NEXT_PUBLIC_API_BASE_URL: z.string().url(),
  NEXT_PUBLIC_APP_URL: z.string().url(),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;
export type ClientEnv = z.infer<typeof clientEnvSchema>;

function fail(scope: string, error: z.ZodError): never {
  // Only the offending variable names are logged — never their values.
  const fields = Object.keys(z.flattenError(error).fieldErrors).join(", ");
  throw new Error(`Invalid ${scope} environment configuration. Check: ${fields}`);
}

let cachedServerEnv: ServerEnv | undefined;
let cachedClientEnv: ClientEnv | undefined;

export function getServerEnv(): ServerEnv {
  if (cachedServerEnv) return cachedServerEnv;

  const parsed = serverEnvSchema.safeParse({
    API_BASE_URL: process.env.API_BASE_URL,
    AUTH_COOKIE_NAME: process.env.AUTH_COOKIE_NAME,
    NODE_ENV: process.env.NODE_ENV,
  });
  if (!parsed.success) fail("server", parsed.error);

  cachedServerEnv = parsed.data;
  return cachedServerEnv;
}

export function getClientEnv(): ClientEnv {
  if (cachedClientEnv) return cachedClientEnv;

  const parsed = clientEnvSchema.safeParse({
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  });
  if (!parsed.success) fail("client", parsed.error);

  cachedClientEnv = parsed.data;
  return cachedClientEnv;
}

/** Name of the httpOnly session cookie. Server-only. */
export function getAuthCookieName(): string {
  return getServerEnv().AUTH_COOKIE_NAME;
}
