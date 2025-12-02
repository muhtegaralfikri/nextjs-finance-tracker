import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { decode } from "@auth/core/jwt";

const matcherPaths = [
  "/dashboard",
  "/wallets",
  "/transactions",
  "/budgets",
  "/settings",
  "/profile",
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const shouldProtect = matcherPaths.some((path) => pathname.startsWith(path));
  if (!shouldProtect) {
    return NextResponse.next();
  }

  const token =
    req.cookies.get("__Secure-authjs.session-token")?.value ||
    req.cookies.get("authjs.session-token")?.value;

  if (!token) {
    return redirectToLogin(req);
  }

  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  if (!secret) {
    console.error("Missing AUTH_SECRET for middleware check");
    return redirectToLogin(req);
  }

  try {
    const session = await decode({
      token,
      secret,
      salt: "authjs.session-token",
    });

    if (!session?.sub) {
      return redirectToLogin(req);
    }

    return NextResponse.next();
  } catch (error) {
    console.error("Failed to decode session in middleware", error);
    return redirectToLogin(req);
  }
}

function redirectToLogin(req: NextRequest) {
  const callbackUrl = req.nextUrl.pathname + req.nextUrl.search;
  const loginUrl = new URL("/login", req.url);
  if (callbackUrl && callbackUrl !== "/login") {
    loginUrl.searchParams.set("callbackUrl", callbackUrl);
  }
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/wallets/:path*",
    "/transactions/:path*",
    "/budgets/:path*",
    "/settings/:path*",
    "/profile/:path*",
  ],
};
