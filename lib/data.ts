import 'server-only'
import { redirect } from 'next/navigation'
import { cache } from 'react'
import { cookies } from 'next/headers'
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin'
import { normalizeContent, normalizeJobTarget, normalizeProfile } from '@/lib/defaults'
import type { JobAnalysis, Resume, ResumeStatus, ResumeTemplate, UserProfile } from '@/lib/types'
import { getDemoProfile, getDemoResume, getDemoResumes, getDemoUser, hasDemoSession, isDemoMode } from '@/lib/demo'

export const RESUME_COLUMNS = 'id, user_id, title, template, status, job_target, analysis, content, created_at, updated_at'

function mapFirestoreResume(id: string, row: any): Resume {
  return {
    id,
    userId: row.user_id,
    title: row.title ?? 'Untitled resume',
    template: (row.template ?? 'modern') as ResumeTemplate,
    status: (row.status ?? 'draft') as ResumeStatus,
    jobTarget: normalizeJobTarget(row.job_target),
    analysis: (row.analysis as JobAnalysis | null) ?? null,
    content: normalizeContent(row.content),
    createdAt: row.created_at ?? new Date().toISOString(),
    updatedAt: row.updated_at ?? row.created_at ?? new Date().toISOString(),
  }
}

export const getSessionUser = cache(async () => {
  if (isDemoMode()) return (await hasDemoSession()) ? getDemoUser() : null
  const cookie = (await cookies()).get('provia-firebase-session')?.value
  if (!cookie) return null
  try {
    const decoded = await getAdminAuth().verifySessionCookie(cookie, true)
    return { id: decoded.uid, email: decoded.email ?? null, user_metadata: { full_name: decoded.name ?? '' } }
  } catch {
    return null
  }
})

export async function requireUser() {
  const user = await getSessionUser()
  if (!user) redirect('/login')
  return user
}

export const getProfile = cache(async (): Promise<UserProfile> => {
  const user = await requireUser()
  if (isDemoMode()) return getDemoProfile()
  const db = getAdminDb()
  const snap = await db.collection('profiles').doc(user.id).get()
  const row = snap.exists ? snap.data() : undefined
  const profileData = normalizeProfile(row?.data)
  if (!profileData.personal.email && user.email) profileData.personal.email = user.email
  return {
    id: user.id,
    data: profileData,
    photoPath: row?.photoUrl ? 'firestore-photo' : null,
    photoUrl: typeof row?.photoUrl === 'string' ? row.photoUrl : null,
    updatedAt: typeof row?.updated_at === 'string' ? row.updated_at : new Date().toISOString(),
  }
})

export async function listResumes(): Promise<Resume[]> {
  const user = await requireUser()
  if (isDemoMode()) return getDemoResumes()
  const snap = await getAdminDb().collection('resumes').where('user_id', '==', user.id).get()
  return snap.docs.map((doc) => mapFirestoreResume(doc.id, doc.data())).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

export async function getResume(id: string): Promise<Resume | null> {
  if (!/^[A-Za-z0-9_-]{20,128}$/.test(id)) return null
  const user = await requireUser()
  if (isDemoMode()) return getDemoResume(id)
  const snap = await getAdminDb().collection('resumes').doc(id).get()
  if (!snap.exists || snap.data()?.user_id !== user.id) return null
  return mapFirestoreResume(snap.id, snap.data())
}
