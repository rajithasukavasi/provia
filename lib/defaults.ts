import type { JobTarget, ResumeContent, ResumeSectionKey, ResumeTemplate, UserProfileData } from './types'

export const EMPTY_PROFILE: UserProfileData = {
  personal: { fullName: '', headline: '', email: '', phone: '', location: '', linkedin: '', github: '', portfolio: '' },
  education: [], experience: [], projects: [],
  skills: { technical: [], soft: [], tools: [], languages: [] },
  certifications: [], achievements: [], interests: [], languages: [],
}

export const EMPTY_JOB_TARGET: JobTarget = { companyName: '', jobTitle: '', jobDescription: '', requiredSkills: '', preferredSkills: '', companyWebsite: '' }

export const DEFAULT_SECTION_ORDER: ResumeSectionKey[] = ['summary', 'skills', 'experience', 'projects', 'education', 'certifications', 'achievements', 'languages', 'interests']

export const SECTION_LABELS: Record<ResumeSectionKey, string> = {
  summary: 'Professional Summary', skills: 'Skills', experience: 'Experience', projects: 'Projects', education: 'Education', certifications: 'Certifications', achievements: 'Achievements', languages: 'Languages', interests: 'Interests',
}

export const TEMPLATES: { id: ResumeTemplate; name: string; description: string }[] = [
  { id: 'modern', name: 'Midnight', description: 'Premium navy header with balanced two-column content' },
  { id: 'minimal', name: 'Clean', description: 'ATS-first editorial layout with restrained typography' },
  { id: 'executive', name: 'Heritage', description: 'Classic serif hierarchy with a burgundy accent' },
  { id: 'professional', name: 'Corporate', description: 'Sharp charcoal header and structured information rail' },
  { id: 'creative', name: 'Studio', description: 'Contemporary plum header with a refined portfolio feel' },
]

export const ACCENT_COLORS = [
  { name: 'Midnight', value: '#243B5A' },
  { name: 'Plum', value: '#68415F' },
  { name: 'Burgundy', value: '#7A3345' },
  { name: 'Slate', value: '#39434F' },
  { name: 'Terracotta', value: '#A35B43' },
]

export function normalizeProfile(raw: unknown): UserProfileData {
  const data = (raw ?? {}) as Partial<UserProfileData>
  return {
    personal: { ...EMPTY_PROFILE.personal, ...(data.personal ?? {}) },
    education: data.education ?? [], experience: data.experience ?? [], projects: data.projects ?? [],
    skills: { ...EMPTY_PROFILE.skills, ...(data.skills ?? {}) }, certifications: data.certifications ?? [], achievements: data.achievements ?? [], interests: data.interests ?? [], languages: data.languages ?? [],
  }
}

export function normalizeJobTarget(raw: unknown): JobTarget { return { ...EMPTY_JOB_TARGET, ...((raw ?? {}) as Partial<JobTarget>) } }

export function normalizeContent(raw: unknown): ResumeContent | null {
  if (!raw) return null
  const c = raw as Partial<ResumeContent>
  return {
    personal: { ...EMPTY_PROFILE.personal, ...(c.personal ?? {}) },
    summary: c.summary ?? '', skills: c.skills ?? [], experience: c.experience ?? [], projects: c.projects ?? [], education: c.education ?? [], certifications: c.certifications ?? [], achievements: c.achievements ?? [], languages: c.languages ?? [], interests: c.interests ?? [],
    sectionOrder: c.sectionOrder?.length ? c.sectionOrder : DEFAULT_SECTION_ORDER,
    hiddenSections: c.hiddenSections ?? [],
    settings: { accent: ACCENT_COLORS[0].value, showPhoto: true, ...(c.settings ?? {}) },
    generatedWith: c.generatedWith ?? 'direct',
  }
}

export function newId() { return crypto.randomUUID() }
