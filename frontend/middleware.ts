import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Helper function to decode JWT without verification (just to check expiration)
// Compatible with Edge runtime
function decodeJWT(token: string): { exp?: number } | null {
  try {
    const base64Url = token.split(".")[1];
    if (!base64Url) return null;

    // Decode base64url (Edge runtime compatible)
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(
      base64.length + ((4 - (base64.length % 4)) % 4),
      "="
    );

    // Use atob for Edge runtime (available in Edge runtime)
    const binaryString = atob(padded);
    const jsonPayload = binaryString
      .split("")
      .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
      .join("");

    return JSON.parse(decodeURIComponent(jsonPayload));
  } catch {
    return null;
  }
}

// Check if token is expired
function isTokenExpired(token: string): boolean {
  const decoded = decodeJWT(token);
  if (!decoded || !decoded.exp) return true;
  const currentTime = Date.now() / 1000;
  return decoded.exp <= currentTime;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes that don't require authentication
  const publicPaths = ["/", "/auth"];
  const isPublicPath = publicPaths.some((path) => pathname.startsWith(path));

  // Get access token from cookie
  const accessToken = request.cookies.get("access_token")?.value;
  const refreshToken = request.cookies.get("refresh_token")?.value;

  // Check if user has valid token
  const hasValidToken =
    accessToken && !isTokenExpired(accessToken) ? true : false;
  const hasRefreshToken = !!refreshToken;

  // Create response
  const response = NextResponse.next();

  // Set auth status header for client components to read
  response.headers.set(
    "x-auth-status",
    hasValidToken ? "authenticated" : "unauthenticated"
  );
  response.headers.set(
    "x-has-refresh-token",
    hasRefreshToken ? "true" : "false"
  );

  // If accessing protected route without valid token, redirect to auth
  if (!isPublicPath && !hasValidToken) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth";
    return NextResponse.redirect(url);
  }

  // If accessing auth page with valid token, redirect to home
  if (isPublicPath && hasValidToken && pathname === "/auth") {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
