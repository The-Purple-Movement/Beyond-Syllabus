import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { hashSync } from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json();
    if (!name || !email || !password) {
      return new Response(JSON.stringify({ error: "Missing fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const existing = await prisma.student.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) {
      return new Response(JSON.stringify({ error: "Email already in use" }), {
        status: 409,
        headers: { "Content-Type": "application/json" },
      });
    }

    const passwordHash = hashSync(password, 12);
    await prisma.student.create({
      data: { name, email: email.toLowerCase(), passwordHash },
    });

    return new Response(null, { status: 201 });
  } catch (e) {
    return new Response(JSON.stringify({ error: "Server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}


