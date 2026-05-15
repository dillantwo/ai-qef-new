import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const SESSION_COOKIE = "session";
const PUBLIC_FILE = /\.[^/]+$/;

// Routes that are accessible without authentication
const PUBLIC_PATHS = ["/login", "/api/auth/login", "/api/health"];

// Subject path prefixes – keys must match Subject type values
const SUBJECT_PREFIXES = ["/math", "/chinese", "/english", "/science", "/humanities"];

function getEncodedKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET env variable is not set");
  return new TextEncoder().encode(secret);
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow public paths
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Allow Next.js internals and static assets
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/public") ||
    PUBLIC_FILE.test(pathname)
  ) {
    return NextResponse.next();
  }

  const token = req.cookies.get(SESSION_COOKIE)?.value;

  if (!token) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    const { payload } = await jwtVerify(token, getEncodedKey(), { algorithms: ["HS256"] });

    // Check subject-level access
    const matchedPrefix = SUBJECT_PREFIXES.find(
      (p) => pathname === p || pathname.startsWith(p + "/")
    );

    if (matchedPrefix) {
      const subject = matchedPrefix.slice(1); // remove leading "/"
      const subjects: string[] = (payload as Record<string, unknown>).subjects as string[] ?? [];
      if (!subjects.includes(subject)) {
        // Redirect to home with an access-denied indicator
        const homeUrl = req.nextUrl.clone();
        homeUrl.pathname = "/";
        homeUrl.searchParams.set("denied", subject);
        return NextResponse.redirect(homeUrl);
      }
    }

    return NextResponse.next();
  } catch {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};
