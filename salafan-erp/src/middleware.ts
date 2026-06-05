import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

const WORKER_ALLOWED_PATHS = [
  '/',
  '/istehsal',
  '/geri-donusum',
  '/cap',
  '/kesme',
  '/aparatlar',
  '/xamal',
]

export default auth((req) => {
  const { nextUrl, auth: session } = req
  const isLoggedIn = !!session?.user

  if (!isLoggedIn && !nextUrl.pathname.startsWith('/login')) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  if (isLoggedIn && session.user.role === 'WORKER') {
    const path = nextUrl.pathname
    const isAllowed = WORKER_ALLOWED_PATHS.some(
      (allowed) => path === allowed || path.startsWith(allowed + '/')
    )
    if (!isAllowed && !path.startsWith('/login') && !path.startsWith('/api')) {
      return NextResponse.redirect(new URL('/', req.url))
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|login).*)'],
}
