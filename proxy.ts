import { clerkMiddleware } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const AUTH_REDIRECT_ROUTES = ['/sign-in', '/sign-up', '/forgot-password']
const PUBLIC_ROUTES = [
  '/',
  '/geoportal',
  '/sobre',
  '/maplibre',
  ...AUTH_REDIRECT_ROUTES,
]

function matchesRoute(pathname: string, route: string) {
  if (route === '/') {
    return pathname === '/'
  }

  return pathname === route || pathname.startsWith(`${route}/`)
}

function isPublicPath(pathname: string) {
  return PUBLIC_ROUTES.some(route => matchesRoute(pathname, route))
}

function isAuthRedirectPath(pathname: string) {
  return AUTH_REDIRECT_ROUTES.some(route => matchesRoute(pathname, route))
}

const clerkProxy = clerkMiddleware(async (auth, request) => {
  const { pathname } = request.nextUrl
  const { userId } = await auth()

  if (pathname === '/') {
    return NextResponse.redirect(
      new URL(userId ? '/dashboard' : '/sign-in', request.url)
    )
  }

  if (userId && isAuthRedirectPath(pathname)) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  if (!isPublicPath(pathname)) {
    await auth.protect()
  }
})

export default clerkProxy
export const proxy = clerkProxy

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|mjs|map|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
    '/__clerk/:path*',
  ],
}
