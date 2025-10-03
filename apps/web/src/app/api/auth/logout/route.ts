import { NextRequest, NextResponse } from "next/server";
import { clearAuthCookie } from "@/lib/auth";

// redirect to home page after logout
function redirectHome(req: NextRequest) {
  const setCookie = clearAuthCookie();
  const url = new URL("/", req.url);
  return new NextResponse(null, {
    status: 303,
    headers: {
      Location: url.toString(),
      "Set-Cookie": setCookie,
    },
  });
}

export async function POST(req: NextRequest) {
  return redirectHome(req);
}

export async function GET(req: NextRequest) {
  return redirectHome(req);
}


