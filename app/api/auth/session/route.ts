import { NextResponse } from 'next/server'
import { getAdminAuth } from '@/lib/firebase-admin'

export async function POST(request: Request) {
  try {
    const { idToken } = await request.json()
    if (typeof idToken !== 'string' || !idToken) {
      return NextResponse.json({ ok: false, error: 'Missing ID token.' }, { status: 400 })
    }
    const expiresIn = 5 * 24 * 60 * 60 * 1000
    const sessionCookie = await getAdminAuth().createSessionCookie(idToken, { expiresIn })
    const response = NextResponse.json({ ok: true })
    response.cookies.set('provia-firebase-session', sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: expiresIn / 1000,
    })
    return response
  } catch (error) {
    console.error('[provia] Firebase session error:', error)
    return NextResponse.json({ ok: false, error: 'Could not establish your session.' }, { status: 401 })
  }
}
