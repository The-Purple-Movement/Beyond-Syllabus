import { NextRequest } from "next/server";

export async function POST(_req: NextRequest) {
  return new Response(JSON.stringify({ error: "Registration not implemented" }), {
    status: 501,
    headers: { "Content-Type": "application/json" },
  });
}


