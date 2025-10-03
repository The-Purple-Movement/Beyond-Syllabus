import { NextRequest } from "next/server";
import { createAuthCookie } from "@/lib/auth";
import { orpc } from "@/lib/orpc";

// body of the login request
type LoginBody = {
  email: string;
  password: string;
};

// user in the environment variables
type EnvUser = { id?: string; email: string; passwordHash: string; name?: string };


// get users
function getEnvUsers(): EnvUser[] | null {
  const raw = process.env.STUDENT_USERS_JSON; //get users from json file (storing in env variables)
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as EnvUser[];
    return null;
  } catch {
    return null;
  }
}

// validate credentials via server
async function validateCredentials(email: string, password: string) {
  if (!email || !password) return null;
  try {
    const { token } = await orpc.auth.login.call({ email, password });
    return token as unknown as string;
  } catch {
    return null;
  }
}

// login route
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as LoginBody;
    const token = await validateCredentials(body.email, body.password);
    if (!token) {
      return new Response(JSON.stringify({ error: "Invalid credentials" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // set cookie with server-issued token
    const setCookie = createAuthCookie(token);

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Set-Cookie": setCookie,
      },
    });
  } catch (e) {
    // bad request
    return new Response(JSON.stringify({ error: "Bad Request" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
}


