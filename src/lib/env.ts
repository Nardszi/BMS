const requiredEnvVars = [
  "DATABASE_URL",
  "NEXTAUTH_SECRET",
  "NEXTAUTH_URL",
] as const;

const optionalEnvVars = [
  "SMTP_HOST",
  "SMTP_PORT",
  "SMTP_USER",
  "SMTP_PASS",
  "SENTRY_DSN",
] as const;

export function validateEnv() {
  const missing: string[] = [];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      missing.push(envVar);
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}. ` +
      `Please add them to your .env.local file.`
    );
  }

  const warnings: string[] = [];
  for (const envVar of optionalEnvVars) {
    if (!process.env[envVar]) {
      warnings.push(envVar);
    }
  }

  if (warnings.length > 0 && process.env.NODE_ENV === "development") {
    console.warn(`[ENV] Optional variables not set: ${warnings.join(", ")}`);
  }

  return {
    database: process.env.DATABASE_URL!,
    nextAuthSecret: process.env.NEXTAUTH_SECRET!,
    nextAuthUrl: process.env.NEXTAUTH_URL!,
    isProduction: process.env.NODE_ENV === "production",
  };
}
