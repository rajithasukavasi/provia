'use server'

import { revalidatePath } from 'next/cache'
import { getAdminDb } from '@/lib/firebase-admin'
import { getSessionUser } from '@/lib/data'
import {
  AIConfigurationError,
  analyzeJobRequirements,
  buildDirectContent,
  generateResumeContent,
  improveResumeContent,
  matchProfileToJob,
} from '@/lib/ai/service'
import { normalizeProfile } from '@/lib/defaults'
import { createDemoResume, deleteDemoResume, duplicateDemoResume, getDemoProfile, getDemoResume, getDemoUser, hasDemoSession, isDemoMode, updateDemoResume } from '@/lib/demo'
import { matchSkills } from '@/lib/matching'
import type { ActionResult, JobAnalysis, JobTarget, Resume, ResumeContent, ResumeTemplate } from '@/lib/types'
import { firstError, jobTargetSchema, resumeContentSchema, templateSchema } from '@/lib/validation'

const SESSION_EXPIRED = { ok: false, error: 'Your session has expired. Please sign in again.' } as const

function aiFailure(error: unknown): ActionResult<never> {
  if (error instanceof AIConfigurationError) return { ok: false, error: error.message, code: 'AI_NOT_CONFIGURED' }
 console.error('[provia] AI error DETAILS:', error)
  return { ok: false, error: error instanceof Error ? error.message : 'The AI request failed. Please try again.', code: 'AI_FAILED' }
}

async function loadOwned(id: string) {
  if (isDemoMode()) {
    const user = (await hasDemoSession()) ? getDemoUser() : null
    return { user, resume: user ? getDemoResume(id) : null }
  }
  const user = await getSessionUser()
  if (!user) return { user: null, resume: null as Resume | null }
  const snap = await getAdminDb().collection('resumes').doc(id).get()
  const row = snap.data()
  if (!snap.exists || row?.user_id !== user.id) return { user, resume: null as Resume | null }
  return {
    user,
    resume: {
      id: snap.id,
      userId: row.user_id,
      title: row.title ?? 'Untitled resume',
      template: (row.template ?? 'modern') as ResumeTemplate,
      status: (row.status ?? 'draft') as Resume['status'],
      jobTarget: row.job_target,
      analysis: row.analysis ?? null,
      content: row.content ?? null,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    } as Resume,
  }
}

async function loadProfileData(userId: string) {
  const snap = await getAdminDb().collection('profiles').doc(userId).get()
  return normalizeProfile(snap.data()?.data)
}

export async function createResume(input: JobTarget): Promise<ActionResult<{ id: string }>> {
  const parsed = jobTargetSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: firstError(parsed.error), code: 'VALIDATION' }
  if (isDemoMode()) {
    const user = (await hasDemoSession()) ? getDemoUser() : null
    if (!user) return SESSION_EXPIRED
    const resume = createDemoResume(parsed.data)
    revalidatePath('/dashboard')
    return { ok: true, data: { id: resume.id } }
  }
  const user = await getSessionUser()
  if (!user) return SESSION_EXPIRED
  const now = new Date().toISOString()
  const ref = getAdminDb().collection('resumes').doc()
  await ref.set({ user_id: user.id, title: `${parsed.data.jobTitle} — ${parsed.data.companyName}`, template: 'modern', status: 'draft', job_target: parsed.data, analysis: null, content: null, created_at: now, updated_at: now })
  revalidatePath('/dashboard')
  return { ok: true, data: { id: ref.id } }
}

export async function updateJobTarget(id: string, input: JobTarget): Promise<ActionResult> {
  const parsed = jobTargetSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: firstError(parsed.error), code: 'VALIDATION' }
  if (isDemoMode()) {
    const updated = updateDemoResume(id, { jobTarget: parsed.data, title: `${parsed.data.jobTitle} — ${parsed.data.companyName}`, analysis: null, status: 'draft' })
    if (!updated) return { ok: false, error: 'Resume not found.', code: 'NOT_FOUND' }
    revalidatePath(`/resume/${id}`); return { ok: true, data: undefined }
  }
  const user = await getSessionUser()
  if (!user) return SESSION_EXPIRED
  const ref = getAdminDb().collection('resumes').doc(id)
  const snap = await ref.get()
  if (!snap.exists || snap.data()?.user_id !== user.id) return { ok: false, error: 'Resume not found.', code: 'NOT_FOUND' }
  await ref.update({ job_target: parsed.data, title: `${parsed.data.jobTitle} — ${parsed.data.companyName}`, analysis: null, status: 'draft', updated_at: new Date().toISOString() })
  revalidatePath(`/resume/${id}`)
  return { ok: true, data: undefined }
}

export async function analyzeResume(id: string): Promise<ActionResult> {
  const { user, resume } = await loadOwned(id)
  if (!user) return SESSION_EXPIRED
  if (!resume) return { ok: false, error: 'Resume not found.', code: 'NOT_FOUND' }
  if (isDemoMode()) {
    const profile = getDemoProfile().data
    const skills = [...profile.skills.technical, ...profile.skills.tools, ...profile.skills.soft, ...profile.skills.languages]
    const match = matchSkills(profile, [...resume.jobTarget.requiredSkills.split(/[,\n]/), ...resume.jobTarget.preferredSkills.split(/[,\n]/)])
    const analysis: JobAnalysis = { targetRole: resume.jobTarget.jobTitle, ...match, keywords: [...new Set(resume.jobTarget.jobDescription.split(/\W+/).filter((word) => word.length > 4))].slice(0, 12), relevantProjectIds: profile.projects.map((p) => p.id), relevantAchievementIds: profile.achievements.map((a) => a.id), relevantExperienceIds: profile.experience.map((e) => e.id), recommendedFocus: [`Lead with your strongest skills: ${skills.slice(0, 4).join(', ') || 'your core skills'}.`, 'Keep the resume concise and focused on evidence already present in your profile.'], sectionsToEmphasize: ['summary', 'skills', 'projects', 'education'], analyzedAt: new Date().toISOString() }
    updateDemoResume(id, { analysis, status: 'analyzed' }); revalidatePath(`/resume/${id}`); return { ok: true, data: undefined }
  }
  const profile = await loadProfileData(user.id)
  try {
    const requirements = await analyzeJobRequirements(resume.jobTarget)
    const analysis = await matchProfileToJob(profile, resume.jobTarget, requirements)
    await getAdminDb().collection('resumes').doc(id).update({ analysis, status: resume.status === 'generated' ? 'generated' : 'analyzed', updated_at: new Date().toISOString() })
  } catch (error) { return aiFailure(error) }
  revalidatePath(`/resume/${id}`)
  return { ok: true, data: undefined }
}

export async function generateResume(id: string, mode: 'ai' | 'direct'): Promise<ActionResult> {
  const { user, resume } = await loadOwned(id)
  if (!user) return SESSION_EXPIRED
  if (!resume) return { ok: false, error: 'Resume not found.', code: 'NOT_FOUND' }
  if (isDemoMode()) {
    if (mode === 'ai') return { ok: false, error: 'AI is not connected in local demo mode. Use Direct generation for now.', code: 'AI_NOT_CONFIGURED' }
    const content = buildDirectContent(getDemoProfile().data)
    if (resume.content) content.settings = resume.content.settings
    updateDemoResume(id, { content, status: 'generated' }); revalidatePath(`/resume/${id}`); revalidatePath('/dashboard'); return { ok: true, data: undefined }
  }
  const profile = await loadProfileData(user.id)
  if (!profile.personal.fullName) return { ok: false, error: 'Add your full name in the profile builder before generating.', code: 'VALIDATION' }
  let content: ResumeContent
  try {
    if (mode === 'ai') {
      if (!resume.analysis) return { ok: false, error: 'Analyze the job requirements first.', code: 'VALIDATION' }
      content = await generateResumeContent(profile, resume.jobTarget, resume.analysis)
    } else content = buildDirectContent(profile)
  } catch (error) { return aiFailure(error) }
  if (resume.content) content.settings = resume.content.settings
  await getAdminDb().collection('resumes').doc(id).update({ content, status: 'generated', updated_at: new Date().toISOString() })
  revalidatePath(`/resume/${id}`); revalidatePath('/dashboard')
  return { ok: true, data: undefined }
}

export async function saveResume(id: string, input: { title: string; template: ResumeTemplate; content: ResumeContent }): Promise<ActionResult<{ updatedAt: string }>> {
  const content = resumeContentSchema.safeParse(input.content)
  if (!content.success) return { ok: false, error: firstError(content.error), code: 'VALIDATION' }
  const template = templateSchema.safeParse(input.template)
  if (!template.success) return { ok: false, error: 'Unknown template.', code: 'VALIDATION' }
  const title = input.title.trim().slice(0, 160) || 'Untitled resume'
  if (isDemoMode()) {
    const updatedAt = new Date().toISOString(); const updated = updateDemoResume(id, { title, template: template.data, content: content.data })
    if (!updated) return { ok: false, error: 'Resume not found.', code: 'NOT_FOUND' }
    revalidatePath(`/resume/${id}`); revalidatePath('/dashboard'); return { ok: true, data: { updatedAt } }
  }
  const user = await getSessionUser(); if (!user) return SESSION_EXPIRED
  const ref = getAdminDb().collection('resumes').doc(id); const snap = await ref.get()
  if (!snap.exists || snap.data()?.user_id !== user.id) return { ok: false, error: 'Resume not found.', code: 'NOT_FOUND' }
  const updatedAt = new Date().toISOString(); await ref.update({ title, template: template.data, content: content.data, updated_at: updatedAt })
  revalidatePath(`/resume/${id}`); revalidatePath('/dashboard')
  return { ok: true, data: { updatedAt } }
}

export async function duplicateResume(id: string): Promise<ActionResult<{ id: string }>> {
  const { user, resume } = await loadOwned(id)
  if (!user) return SESSION_EXPIRED
  if (!resume) return { ok: false, error: 'Resume not found.', code: 'NOT_FOUND' }
  if (isDemoMode()) { const copy = duplicateDemoResume(id); if (!copy) return { ok: false, error: 'Resume not found.', code: 'NOT_FOUND' }; revalidatePath('/dashboard'); return { ok: true, data: { id: copy.id } } }
  const now = new Date().toISOString(); const ref = getAdminDb().collection('resumes').doc()
  await ref.set({ user_id: user.id, title: `${resume.title} (copy)`.slice(0, 160), template: resume.template, status: resume.status, job_target: resume.jobTarget, analysis: resume.analysis, content: resume.content, created_at: now, updated_at: now })
  revalidatePath('/dashboard'); return { ok: true, data: { id: ref.id } }
}

export async function deleteResume(id: string): Promise<ActionResult> {
  if (isDemoMode()) { if (!deleteDemoResume(id)) return { ok: false, error: 'Resume not found.', code: 'NOT_FOUND' }; revalidatePath('/dashboard'); return { ok: true, data: undefined } }
  const user = await getSessionUser(); if (!user) return SESSION_EXPIRED
  const ref = getAdminDb().collection('resumes').doc(id); const snap = await ref.get()
  if (!snap.exists || snap.data()?.user_id !== user.id) return { ok: false, error: 'Resume not found.', code: 'NOT_FOUND' }
  await ref.delete(); revalidatePath('/dashboard'); return { ok: true, data: undefined }
}

export async function improveText(id: string, kind: 'summary' | 'bullet', text: string): Promise<ActionResult<{ text: string }>> {
  if (!text.trim()) return { ok: false, error: 'Write some text first, then improve it.', code: 'VALIDATION' }
  if (text.length > 2000) return { ok: false, error: 'Text is too long to improve.', code: 'VALIDATION' }
  const { user, resume } = await loadOwned(id)
  if (!user) return SESSION_EXPIRED
  if (!resume) return { ok: false, error: 'Resume not found.', code: 'NOT_FOUND' }
  if (isDemoMode()) return { ok: true, data: { text: text.trim() } }
  try {
    const improved = await improveResumeContent(kind, text, { jobTitle: resume.jobTarget.jobTitle, companyName: resume.jobTarget.companyName })
    return { ok: true, data: { text: improved } }
  } catch (error) { return aiFailure(error) }
}
