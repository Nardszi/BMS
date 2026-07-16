import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const roleRoutes: Record<string, string[]> = {
  ADMIN: ["/", "/residents", "/certificates", "/blotter", "/permits", "/officials", "/announcements", "/reports"],
  SECRETARY: ["/", "/residents", "/certificates", "/blotter", "/announcements"],
  TREASURER: ["/", "/permits", "/residents"],
  KAGAWAD: ["/", "/blotter"],
  STAFF: ["/", "/residents", "/certificates"],
};

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  const { pathname } = request.nextUrl;

  // Allow login page, static assets, and API auth routes
  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/api/auth") ||
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
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Check role-based access
  const userRole = token.role as string;
  const allowedRoutes = roleRoutes[userRole] || [];

  const isAllowed = allowedRoutes.some((route) => {
    if (route === "/") return pathname === "/";
    return pathname.startsWith(route);
  });

  if (!isAllowed) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|barangay-seal.png).*)"],
};
