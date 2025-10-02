import { NextRequest } from "next/server";
import { createAuthCookie, signStudentJwt } from "@/lib/auth";
import { compare } from "bcryptjs";

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

// validate credentials
async function validateCredentials(email: string, password: string) {
  if (!email || !password) return null;

  const envUsers = getEnvUsers();
  if (!envUsers) {
    if (process.env.NODE_ENV === "production") {
      return null;
    }
    // dev fallback: accept any non-empty credentials for development
    return {
      id: email.toLowerCase(),
      email: email.toLowerCase(),
      name: email.split("@")[0],
    } as const;
  }

  // find user
  const user = envUsers.find(
    (u) => u.email.toLowerCase() === email.toLowerCase()
  );
  if (!user) return null;

  // validate password
  const ok = await compare(password, user.passwordHash);
  if (!ok) return null;
  return {
    id: user.id ?? user.email.toLowerCase(),
    email: user.email.toLowerCase(),
    name: user.name ?? user.email.split("@")[0],
  } as const;
}

// login route
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as LoginBody;
    const user = await validateCredentials(body.email, body.password);
    if (!user) {
      return new Response(JSON.stringify({ error: "Invalid credentials" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // sign token
    const token = await signStudentJwt({
      sub: user.id,
      email: user.email,
      name: user.name,
      role: "student",
    });

    // create cookie
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


