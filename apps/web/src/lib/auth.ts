import { SignJWT, jwtVerify, JWTPayload } from "jose";

const encoder = new TextEncoder();

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("JWT_SECRET must be set in production");
    }
    return encoder.encode("dev-secret-change-me");
  }
  return encoder.encode(secret);
}

export type StudentSession = {
  sub: string;
  email: string;
  name?: string;
  role: "student"; // add roles here as needed
};

// sign a JWT for a student session
export async function signStudentJwt(payload: StudentSession, expiresInSeconds = 60 * 60 * 24 * 7): Promise<string> {
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + expiresInSeconds;
  return await new SignJWT({ ...payload, iat } as JWTPayload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt(iat)
    .setExpirationTime(exp)
    .sign(getJwtSecret());
}

export async function verifyStudentJwt<T extends JWTPayload>(token: string): Promise<T> {
  const { payload } = await jwtVerify<T>(token, getJwtSecret(), {
    algorithms: ["HS256"],
  });
  return payload;
}

// create auth cookie
export function createAuthCookie(token: string): string {
  // HttpOnly cookie string for Next Response.header("Set-Cookie", ...)
  const maxAge = 60 * 60 * 24 * 7;
  const isProd = process.env.NODE_ENV === "production";
  const attributes = [
    `HttpOnly`,
    `Path=/`,
    `SameSite=Lax`,
    `Max-Age=${maxAge}`,
    isProd ? "Secure" : undefined,
  ].filter(Boolean);
  return `student_session=${token}; ${attributes.join("; ")}`;
}

// clear auth cookie
export function clearAuthCookie(): string {
  const isProd = process.env.NODE_ENV === "production";
  const attributes = [
    `HttpOnly`,
    `Path=/`,
    `SameSite=Lax`,
    `Max-Age=0`,
    `Expires=Thu, 01 Jan 1970 00:00:00 GMT`,
    isProd ? "Secure" : undefined,
  ].filter(Boolean);
  return `student_session=; ${attributes.join("; ")}`;
}


