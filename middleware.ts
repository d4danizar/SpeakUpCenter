import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

// All internal staff roles — can access /admin routes
const STAFF_ROLES = ["SUPER_ADMIN", "MANAGER", "CS", "MARKETING", "CREATOR"];

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const { pathname } = req.nextUrl;
  const userRole = (token?.role as string) ?? "";

  if (pathname === "/login" || pathname === "/") {
    console.warn("=== LOGIN ATTEMPT / MIDDLEWARE DEBUG ===");
    console.warn("Pathname:", pathname);
    console.warn("Token:", token);
    console.warn("Role parsed:", userRole);
  }

  // ── Protect authenticated routes ──────────────────────────────────────────
  const isProtectedPath =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/tutor") ||
    pathname.startsWith("/student");

  if (isProtectedPath) {
    // Not logged in → redirect to login
    if (!token) {
      const url = new URL("/login", req.url);
      url.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(url);
    }

    // /admin → only staff roles allowed; others sent to their own area
    if (pathname.startsWith("/admin")) {
      if (STAFF_ROLES.includes(userRole)) {
        return NextResponse.next();
      }
      if (userRole === "TUTOR") return NextResponse.redirect(new URL("/tutor/dashboard", req.url));
      if (userRole === "STUDENT") return NextResponse.redirect(new URL("/student/dashboard", req.url));
      return NextResponse.redirect(new URL("/login?error=unauthorized_admin", req.url));
    }

    // /tutor → TUTOR only
    if (pathname.startsWith("/tutor")) {
      if (userRole === "TUTOR") return NextResponse.next();
      return NextResponse.redirect(new URL("/login?error=unauthorized_tutor", req.url));
    }

    // /student → STUDENT only
    if (pathname.startsWith("/student")) {
      if (userRole === "STUDENT") return NextResponse.next();
      return NextResponse.redirect(new URL("/login?error=unauthorized_student", req.url));
    }
  }

  // ── Post-login redirect from "/" or "/login" ──────────────────────────────
  if ((pathname === "/" || pathname === "/login") && token) {
    // Staff → /admin (landing page handles role-specific content)
    if (STAFF_ROLES.includes(userRole)) {
      // Role dengan tugas utama CRM diarahkan ke /admin/crm
      if (["SUPER_ADMIN", "CS", "MARKETING", "MANAGER"].includes(userRole)) {
        return NextResponse.redirect(new URL("/admin/crm", req.url));
      }
      return NextResponse.redirect(new URL("/admin/dashboard", req.url));
    }
    if (userRole === "TUTOR") return NextResponse.redirect(new URL("/tutor/dashboard", req.url));
    if (userRole === "STUDENT") return NextResponse.redirect(new URL("/student/dashboard", req.url));
    
    // Jika ada token tapi rolenya blank/tidak dikenali (mencegah silent loop!)
    console.warn("Broken role in token, redirecting with error");
    return NextResponse.redirect(new URL("/login?error=broken_role", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Melindungi seluruh varian sub-pathing
    "/admin",
    "/admin/:path*",
    "/tutor",
    "/tutor/:path*",
    "/student",
    "/student/:path*",
    "/login",
    "/",
  ],
};
