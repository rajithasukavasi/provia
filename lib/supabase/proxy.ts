import { isDemoMode, hasDemoSession } from '@/lib/demo'
import { FIREBASE_SESSION_COOKIE } from '@/lib/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'

const PROTECTED_PREFIXES = ['/dashboard', '/profile', '/resume', '/job-target', '/settings']
const AUTH_PAGES = ['/login', '/register', '/forgot-password', '/sign-up']

export async function updateSession(request: NextRequest) {
  const path = request.nextUrl.pathname
  const isProtected = PROTECTED_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`))
  const hasSession = isDemoMode() ? await hasDemoSession() : Boolean(request.cookies.get(FIREBASE_SESSION_COOKIE)?.value)
  if (isProtected && !hasSession) {
    const url = request.nextUrl.clone(); url.pathname = '/login'; url.searchParams.set('next', path); return NextResponse.redirect(url)
  }
  if (hasSession && AUTH_PAGES.includes(path)) {
    const url = request.nextUrl.clone(); url.pathname = '/dashboard'; url.search = ''; return NextResponse.redirect(url)
  }
  return NextResponse.next()
}
