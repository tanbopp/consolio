import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;

    // Proteksi route khusus Admin Aplikasi
    if (pathname.startsWith("/admin/settings")) {
      if (token?.role !== "PLATFORM_ADMIN") {
        return NextResponse.redirect(new URL("/dashboard?error=forbidden_admin", req.url));
      }
    }

    // Proteksi route khusus Admin Cluster atau Admin Aplikasi
    if (pathname.startsWith("/cluster-admin")) {
      if (token?.role !== "CLUSTER_ADMIN" && token?.role !== "PLATFORM_ADMIN") {
        return NextResponse.redirect(
          new URL("/dashboard?error=forbidden_cluster_admin", req.url)
        );
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const pathname = req.nextUrl.pathname;
        // Izinkan halaman detail pickup bersama diakses publik via link share (misal /pickups/gp-101)
        if (
          pathname.startsWith("/pickups/") &&
          pathname !== "/pickups/next"
        ) {
          return true;
        }
        return !!token;
      },
    },
    pages: {
      signIn: "/login",
    },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/onboarding/:path*",
    "/drafts/:path*",
    "/pickups/:path*",
    "/history/:path*",
    "/cluster-admin/:path*",
    "/admin/:path*",
  ],
};

