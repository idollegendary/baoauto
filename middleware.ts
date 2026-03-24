import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Перевіряємо, чи активний режим технічного обслуговування
  if (process.env.NEXT_PUBLIC_MAINTENANCE_MODE === 'true') {
    // Не блокуємо API маршрути, статичні файли, sitemap та maintenance
    if (
      !request.nextUrl.pathname.startsWith('/api/') &&
      !request.nextUrl.pathname.startsWith('/_next/') &&
      !request.nextUrl.pathname.startsWith('/public/') &&
      request.nextUrl.pathname !== '/maintenance' &&
      request.nextUrl.pathname !== '/sitemap.xml'
    ) {
      return NextResponse.redirect(new URL('/maintenance', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}