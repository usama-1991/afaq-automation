import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|media).*)',
  ],
};

export function middleware(req: NextRequest) {
  const url = req.nextUrl;
  
  // Get hostname of request (e.g. app.ittisalo.com, ittisalo.com, localhost:3000)
  let hostname = req.headers.get('host') || '';

  // Remove port if exists (for localhost)
  hostname = hostname.split(':')[0];

  const isAppSubdomain = hostname === 'app.ittisalo.com';
  
  // If accessing the root of the app subdomain, redirect to dashboard
  if (isAppSubdomain && url.pathname === '/') {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }
  
  return NextResponse.next();
}
