import { NextRequest } from "next/server";
import { verifyStudentJwt } from "@/lib/auth";

// get user from cookie
export async function GET(req: NextRequest) {
  try {
    const cookie = req.headers.get("cookie") || "";
    const match = cookie.match(/(?:^|;\s*)student_session=([^;]+)/);
    const token = match?.[1];
    if (!token) {
      return new Response(JSON.stringify({ user: null }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
    
    // verify token
    const payload = await verifyStudentJwt(token);
    if (payload.role !== "student") {
      return new Response(JSON.stringify({ user: null }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // return user
    return new Response(
      JSON.stringify({
        user: {
          id: payload.sub,
          email: payload.email,
          name: payload.name,
          role: payload.role,
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch {
    // return null if user is not found
    return new Response(JSON.stringify({ user: null }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
}


