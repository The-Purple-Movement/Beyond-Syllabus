import "dotenv/config";
import { z } from "zod";

console.log("🔐 Loading environment variables...");

const serverSchema = z.object({
  NODE_ENV: z.string(),
  CORS_ORIGIN: z.string().optional(),
  PORT: z.coerce.number().default(3000),
  UPSTASH_REDIS_URL: z.string(),
  UPSTASH_REDIS_TOKEN: z.string(),
});

const _serverEnv = serverSchema.safeParse(process.env);

if (!_serverEnv.success) {
  console.error("❌ Invalid environment variables:\n");
  _serverEnv.error.issues.forEach((issue) => {
    console.error(issue);
  });
  throw new Error("Invalid environment variables");
}

const {
  NODE_ENV,
  CORS_ORIGIN,
  PORT,
  UPSTASH_REDIS_URL,
  UPSTASH_REDIS_TOKEN,
} = _serverEnv.data;

export const env = {
  NODE_ENV,
  CORS_ORIGIN,
  PORT,
  UPSTASH_REDIS_URL,
  UPSTASH_REDIS_TOKEN,
};
console.log("✅ Environment variables loaded");
