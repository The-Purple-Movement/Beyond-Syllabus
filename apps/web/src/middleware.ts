import { NextResponse, NextRequest } from "next/server";
import { verifyStudentJwt } from "@/lib/auth";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname.startsWith("/student")) {
    const cookie = req.headers.get("cookie") || "";
    const match = cookie.match(/(?:^|;\s*)student_session=([^;]+)/);
    const token = match?.[1];
    if (!token) {
      const url = new URL("/auth", req.url);
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
    try {
      const payload = await verifyStudentJwt(token);
      if (payload.role !== "student") {
        const url = new URL("/auth", req.url);
        url.searchParams.set("next", pathname);
        return NextResponse.redirect(url);
      }
      return NextResponse.next();
    } catch {
      const url = new URL("/auth", req.url);
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/student/:path*"],
};


