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

  const tokenCookie =
    req.cookies.get("__Secure-authjs.session-token") ||
    req.cookies.get("authjs.session-token");
  const token = tokenCookie?.value;
  const tokenName = tokenCookie?.name || "authjs.session-token";

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
      salt: tokenName,
    });

    if (!session?.sub) {
      console.error("[proxy] decode ok but no sub");
      return redirectToLogin(req);
    }

    return NextResponse.next();
  } catch (error) {
    const tokenSnippet = token.slice(0, 20);
    console.error("[proxy] Failed to decode session", {
      error,
      secretLength: secret.length,
      hasToken: Boolean(token),
      tokenPrefix: tokenSnippet,
      processEnvAuthSecretLen: (process.env.AUTH_SECRET || "").length,
      processEnvNextAuthSecretLen: (process.env.NEXTAUTH_SECRET || "").length,
      nextAuthUrl: process.env.NEXTAUTH_URL,
      tokenName,
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
