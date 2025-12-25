import { jwtDecode } from "jwt-decode";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Hàm check đơn giản không verify signature (để performance tốt ở middleware)
function isTokenExpired(token: string): boolean {
  try {
    const claims = jwtDecode(token);
    if (!claims || !claims.exp) return true;
    const currentTime = Date.now() / 1000;
    // Thêm buffer 10s để tránh lệch giờ
    return claims.exp < currentTime - 10;
  } catch {
    return true;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const accessToken = request.cookies.get("access_token")?.value;
  const refreshToken = request.cookies.get("refresh_token")?.value;

  console.log(refreshToken);
  // Logic quan trọng:
  // 1. Có Access Token còn hạn -> Authenticated
  // 2. Access Token hết hạn (hoặc không có) NHƯNG có Refresh Token -> Vẫn cho qua (Client sẽ tự refresh)
  // 3. Không có cả hai -> Unauthenticated

  const isAccessTokenValid = accessToken && !isTokenExpired(accessToken);
  const canRefresh = !!refreshToken;

  // Ta coi là "đã đăng nhập" nếu token hợp lệ HOẶC có thể refresh
  const isAuthenticated = isAccessTokenValid || canRefresh;

  const publicPaths = ["/", "/auth"];
  const isPublicPath = publicPaths.some((path) => pathname.startsWith(path));

  // 1. Nếu chưa đăng nhập mà vào Private Route -> Đá về Login
  if (!isPublicPath && !isAuthenticated) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth";
    // Thêm callbackUrl nếu muốn trải nghiệm tốt hơn
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  // 2. Nếu đã đăng nhập mà vào trang Auth -> Đá về Home
  if (isPublicPath && isAuthenticated && pathname === "/auth") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const response = NextResponse.next();

  // Set header để Client Component biết trạng thái mà không cần check lại cookie
  response.headers.set(
    "x-auth-status",
    isAuthenticated ? "authenticated" : "unauthenticated"
  );

  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
