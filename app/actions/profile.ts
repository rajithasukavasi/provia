'use server'

import { revalidatePath } from 'next/cache'
import { getAdminDb } from '@/lib/firebase-admin'
import { getDemoProfile, isDemoMode, setDemoProfile, setDemoProfilePhoto } from '@/lib/demo'
import { getSessionUser } from '@/lib/data'
import type { ActionResult, UserProfileData } from '@/lib/types'
import { firstError, profileSchema } from '@/lib/validation'

export async function saveProfile(input: UserProfileData): Promise<ActionResult> {
  const parsed = profileSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: firstError(parsed.error), code: 'VALIDATION' }
  if (isDemoMode()) {
    setDemoProfile(parsed.data)
    revalidatePath('/profile'); revalidatePath('/dashboard')
    return { ok: true, data: undefined }
  }
  const user = await getSessionUser()
  if (!user) return { ok: false, error: 'Your session has expired. Please sign in again.' }
  const ref = getAdminDb().collection('profiles').doc(user.id)
  const existing = await ref.get()
  const old = existing.exists ? existing.data() : undefined
  await ref.set({
    full_name: parsed.data.personal.fullName,
    data: parsed.data,
    photoUrl: old?.photoUrl ?? null,
    updated_at: new Date().toISOString(),
  }, { merge: true })
  revalidatePath('/profile'); revalidatePath('/dashboard')
  return { ok: true, data: undefined }
}

export async function saveProfilePhoto(dataUrl: string | null): Promise<ActionResult<{ url: string | null }>> {
  if (dataUrl && (!dataUrl.startsWith('data:image/') || dataUrl.length > 800_000)) return { ok: false, error: 'Please choose a smaller image (under about 600 KB).', code: 'VALIDATION' }
  if (isDemoMode()) {
    setDemoProfilePhoto(dataUrl)
    revalidatePath('/profile'); revalidatePath('/dashboard')
    return { ok: true, data: { url: dataUrl } }
  }
  const user = await getSessionUser()
  if (!user) return { ok: false, error: 'Your session has expired. Please sign in again.' }
  await getAdminDb().collection('profiles').doc(user.id).set({ photoUrl: dataUrl, updated_at: new Date().toISOString() }, { merge: true })
  revalidatePath('/profile'); revalidatePath('/dashboard')
  return { ok: true, data: { url: dataUrl } }
}

export async function setProfilePhoto(path: string | null): Promise<ActionResult<{ url: string | null }>> {
  if (isDemoMode()) {
    const profile = getDemoProfile()
    return { ok: true, data: { url: profile.photoUrl } }
  }
  const user = await getSessionUser()
  if (!user) return { ok: false, error: 'Your session has expired. Please sign in again.' }
  const snap = await getAdminDb().collection('profiles').doc(user.id).get()
  return { ok: true, data: { url: typeof snap.data()?.photoUrl === 'string' ? snap.data()?.photoUrl : null } }
}
