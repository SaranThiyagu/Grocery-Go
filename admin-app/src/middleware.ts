import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const user = request.cookies.get('user')?.value;
  const { pathname } = request.nextUrl;

  // For development, we'll also check localStorage in a way that works with middleware
  // Since middleware can't access localStorage, we'll rely on cookies
  // But we can set a cookie when user logs in

  // If trying to access protected routes without authentication
  if (pathname.startsWith('/admin') && !user) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If authenticated and trying to access login, redirect to admin
  if (pathname === '/login' && user) {
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/login']
};