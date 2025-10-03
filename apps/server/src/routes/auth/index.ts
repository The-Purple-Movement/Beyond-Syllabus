import { supabase } from "../../lib/supabase";
import { publicProcedure } from "../../lib/orpc";
import { z } from "zod";
import { hashSync, compareSync } from "bcryptjs";
import { SignJWT } from "jose";

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

      // check if user exists
      const { data: existing, error: findErr } = await supabase
        .from("students")
        .select("id")
        .eq("email", email.toLowerCase())
        .single();

      if (existing) throw new Error("CONFLICT");

      const passwordHash = hashSync(password, 12);

      const { error: insertErr } = await supabase.from("students").insert([
        {
          name,
          email: email.toLowerCase(),
          password_hash: passwordHash,
        },
      ]);

      if (insertErr) throw insertErr;

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

      const { data: user, error } = await supabase
        .from("students")
        .select("*")
        .eq("email", email.toLowerCase())
        .single();

      if (!user) throw new Error("UNAUTHORIZED");

      const ok = compareSync(password, user.password_hash);
      if (!ok) throw new Error("UNAUTHORIZED");

      const iat = Math.floor(Date.now() / 1000);
      const exp = iat + 60 * 60 * 24 * 7;

      const token = await new SignJWT({
        sub: user.id,
        email: user.email,
        name: user.name,
        role: "student",
      })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt(iat)
        .setExpirationTime(exp)
        .sign(getJwtSecret());

      return { token } as const;
    }),
};

export type AuthRoutes = typeof authRoutes;