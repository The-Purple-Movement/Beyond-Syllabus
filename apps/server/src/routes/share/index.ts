import { Redis } from "@upstash/redis";
import { ORPCError } from "@orpc/client";
import { publicProcedure } from "../../lib/orpc";
import { env } from "../../config/env";
import { randomBytes } from "node:crypto";

function generateToken(length = 6): string {
  return randomBytes(length).toString("base64url").slice(0, length);
}

const redis = new Redis({
  url: env.UPSTASH_REDIS_URL,
  token: env.UPSTASH_REDIS_TOKEN,
});

export const shareRoutes = {
  createShare: publicProcedure.handler(async ({ input }) => {
    const { url } = input as { url: string };

    let token: string;
    let exists: string | null;

    do {
      token = generateToken(6);
      exists = await redis.get(token);
    } while (exists);

    await redis.set(token, url, { ex: 60 * 60 * 24 * 7 });

    return {
      url: `https://beyondsyllabus.in/share/${token}`,
      token,
    };
  }),

  getShare: publicProcedure.handler(async ({ input }) => {
    const { token } = input as { token: string };

    const url = await redis.get<string>(token);
    if (!url) {
      throw new ORPCError("Not Found", {
        message: "Share not found or has expired",
      });
    }

    return { url };
  }),
};
