import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  try {
    return await updateSession(request)
  } catch (e) {
    // If middleware fails (e.g. missing env vars), allow the request through
    // so the page-level error handling can take over
    return NextResponse.next()
  }
}

export const config = {
  matcher: ['/admin/:path*', '/login']
};