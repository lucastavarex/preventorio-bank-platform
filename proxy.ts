import { type NextRequest, NextResponse, type ProxyConfig } from 'next/server'

const publicRoutes = [
  { path: '/', whenAuthenticated: 'next' },
  { path: '/sign-in', whenAuthenticated: 'redirect' },
  { path: '/geoportal', whenAuthenticated: 'next' },
  { path: '/sobre', whenAuthenticated: 'next' },
]

const REDIRECT_WHEN_NOT_AUTHENTICATED_ROUTE = '/sign-in'

export function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname

  const publicRoute = publicRoutes.find(route => route.path === path)

  const authToken = request.cookies.get('token')

  // Usuário não autenticado acessando rota pública
  if (!authToken && publicRoute) {
    return NextResponse.next()
  }

  // Usuário não autenticado acessando rota privada
  if (!authToken && !publicRoute) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = REDIRECT_WHEN_NOT_AUTHENTICATED_ROUTE
    return NextResponse.redirect(redirectUrl)
  }

  // Usuário autenticado acessando página de login/cadastro
  if (
    authToken &&
    publicRoute &&
    publicRoute.whenAuthenticated === 'redirect'
  ) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/'
    return NextResponse.redirect(redirectUrl)
  }

  // Usuário autenticado acessando rota privada
  if (authToken && !publicRoute) {
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config: ProxyConfig = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
}
