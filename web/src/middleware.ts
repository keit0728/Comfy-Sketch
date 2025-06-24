import { NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";

const intlMiddleware = createMiddleware(routing);

export async function middleware(request: NextRequest) {
  const intlRes = intlMiddleware(request);
  intlRes.headers.set("x-pathname", request.nextUrl.pathname);
  return intlRes;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|sw.js|opengraph-image.jpg|twitter-image.jpg|images).*)",
  ],
};
