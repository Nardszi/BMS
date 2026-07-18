import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const roleRoutes: Record<string, string[]> = {
  ADMIN: ["/", "/residents", "/households", "/barangay-ids", "/certificates", "/blotter", "/permits", "/officials", "/announcements", "/reports", "/users"],
  SECRETARY: ["/", "/residents", "/households", "/barangay-ids", "/certificates", "/blotter", "/announcements"],
  TREASURER: ["/", "/permits", "/residents"],
  KAGAWAD: ["/", "/blotter"],
  STAFF: ["/", "/residents", "/certificates"],
};

const apiRoleRoutes: Record<string, string[]> = {
  ADMIN: ["/api/residents", "/api/barangay-ids", "/api/certificates", "/api/blotter", "/api/permits", "/api/officials", "/api/announcements", "/api/reports", "/api/users", "/api/dashboard", "/api/households", "/api/upload", "/api/notifications"],
  SECRETARY: ["/api/residents", "/api/barangay-ids", "/api/certificates", "/api/blotter", "/api/announcements", "/api/reports", "/api/dashboard", "/api/upload", "/api/notifications"],
  TREASURER: ["/api/permits", "/api/residents", "/api/reports", "/api/dashboard", "/api/notifications"],
  KAGAWAD: ["/api/blotter", "/api/residents", "/api/dashboard", "/api/notifications"],
  STAFF: ["/api/residents", "/api/certificates", "/api/dashboard", "/api/notifications"],
};

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/verify") ||
    pathname.startsWith("/api/register") ||
    pathname.startsWith("/verify") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname === "/barangay-seal.png"
  ) {
    if (token && pathname.startsWith("/login")) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  // Redirect to login if not authenticated
  if (!token) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const userRole = token.role as string;

  // API route protection
  if (pathname.startsWith("/api/")) {
    const allowedApis = apiRoleRoutes[userRole] || [];
    const isAllowed = allowedApis.some((route) => pathname === route || pathname.startsWith(route + "/"));
    if (!isAllowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.next();
  }

  // Page route protection
  const allowedRoutes = roleRoutes[userRole] || [];
  const isAllowed = allowedRoutes.some((route) => {
    if (route === "/") return pathname === "/";
    return pathname === route || pathname.startsWith(route + "/");
  });

  if (!isAllowed) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|barangay-seal.png).*)"],
};
