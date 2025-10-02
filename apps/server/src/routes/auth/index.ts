import { publicProcedure } from "../../lib/orpc";
import type { RouterClient } from "@orpc/server";
import { prisma } from "../../lib/db";
import { hashSync, compareSync } from "bcryptjs";
import { SignJWT } from "jose";
import { z } from "zod";

const encoder = new TextEncoder();
function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET must be set");
  return encoder.encode(secret);
}

export const authRoutes = {
  register: publicProcedure
    .input(
      z.object({
        name: z.string().min(3),
        email: z.string().email(),
        password: z.string().min(6),
      })
    )
    .handler(async ({ input }) => {
      const { name, email, password } = input;
      if (!name || !email || !password) throw new Error("BAD_REQUEST");
      const exists = await prisma.student.findUnique({ where: { email: email.toLowerCase() } });
      if (exists) throw new Error("CONFLICT");
      const passwordHash = hashSync(password, 12);
      await prisma.student.create({ data: { name, email: email.toLowerCase(), passwordHash } });
      return { ok: true } as const;
    }),
  login: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(6),
      })
    )
    .handler(async ({ input }) => {
      const { email, password } = input;
      const user = await prisma.student.findUnique({ where: { email: email.toLowerCase() } });
      if (!user) throw new Error("UNAUTHORIZED");
      const ok = compareSync(password, user.passwordHash);
      if (!ok) throw new Error("UNAUTHORIZED");
      const iat = Math.floor(Date.now() / 1000);
      const exp = iat + 60 * 60 * 24 * 7;
      const token = await new SignJWT({ sub: user.id, email: user.email, name: user.name, role: "student" })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt(iat)
        .setExpirationTime(exp)
        .sign(getJwtSecret());
      return { token } as const;
    }),
};
export type AuthRoutes = typeof authRoutes;


