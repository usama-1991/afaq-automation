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

  // Define our allowed domains
  const isAppSubdomain = hostname === 'app.ittisalo.com';
  const isMainDomain = hostname === 'ittisalo.com' || hostname === 'www.ittisalo.com';
  
  // For local development
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';

  // If we are on the main domain (ittisalo.com) AND accessing the root path (/)
  if (isMainDomain && url.pathname === '/') {
    // Rewrite the request to our hidden /landing route
    return NextResponse.rewrite(new URL('/landing', req.url));
  }
  
  // (Optional) If you want all traffic on ittisalo.com to stay on the landing page routes, 
  // you can rewrite all of them:
  // if (isMainDomain) {
  //   return NextResponse.rewrite(new URL(`/landing${url.pathname}`, req.url));
  // }

  // Otherwise, let the request proceed normally (which means the portal works)
  return NextResponse.next();
}
