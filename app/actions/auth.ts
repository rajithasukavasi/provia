'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { clearDemoSession, isDemoMode, setDemoSession } from '@/lib/demo'

export async function signOut() {
  if (isDemoMode()) {
    await clearDemoSession()
    redirect('/login')
  }
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export async function signInDemo() {
  if (!isDemoMode()) return { ok: false as const, error: 'Demo mode is disabled.' }
  await setDemoSession()
  redirect('/dashboard')
}
