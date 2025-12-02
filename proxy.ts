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

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const shouldProtect = matcherPaths.some((path) => pathname.startsWith(path));
  if (!shouldProtect) {
    return NextResponse.next();
  }

  const token =
    req.cookies.get("__Secure-authjs.session-token")?.value ||
    req.cookies.get("authjs.session-token")?.value;

  if (!token) {
    console.log("[proxy] no token, redirecting");
    return redirectToLogin(req);
  }

  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  if (!secret) {
    console.error("[proxy] Missing AUTH_SECRET/NEXTAUTH_SECRET for proxy check");
    return redirectToLogin(req);
  }

  try {
    const session = await decode({
      token,
      secret,
      salt: "authjs.session-token",
    });

    if (!session?.sub) {
      console.error("[proxy] decode ok but no sub");
      return redirectToLogin(req);
    }

    return NextResponse.next();
  } catch (error) {
    console.error("[proxy] Failed to decode session", {
      error,
      secretLength: secret.length,
      hasToken: Boolean(token),
      tokenPrefix: token.slice(0, 10),
    });
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
