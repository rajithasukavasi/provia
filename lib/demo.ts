import 'server-only'

import { cookies } from 'next/headers'
import { EMPTY_PROFILE, normalizeJobTarget, normalizeProfile, newId } from '@/lib/defaults'
import type { JobTarget, Resume, UserProfile, UserProfileData } from '@/lib/types'

export const DEMO_COOKIE = 'provia-demo-session'
export const DEMO_USER_ID = 'demo-user'
export const DEMO_EMAIL = 'demo@provia.local'

const demoProfileData: UserProfileData = {
  ...EMPTY_PROFILE,
  personal: {
    ...EMPTY_PROFILE.personal,
    fullName: 'Jordan Lee',
    headline: 'Computer Science Student & Frontend Developer',
    email: DEMO_EMAIL,
    phone: '+91 90000 00000',
    location: 'Hyderabad, India',
    linkedin: 'linkedin.com/in/jordan-lee',
    github: 'github.com/jordanlee',
    portfolio: 'jordanlee.dev',
  },
  education: [
    {
      id: 'demo-education',
      institution: 'Example Institute of Technology',
      degree: 'B.Tech',
      field: 'Computer Science and Engineering',
      startDate: '2024',
      endDate: '2028',
      description: 'Coursework in software engineering, databases and web development.',
    },
  ],
  experience: [],
  projects: [
    {
      id: 'demo-project',
      name: 'Community Web Platform',
      description: 'Built a responsive web application with reusable React components and accessible interfaces.',
      technologies: 'React, TypeScript, HTML, CSS',
      url: '',
      githubUrl: '',
    },
  ],
  skills: {
    technical: ['React', 'TypeScript', 'HTML', 'CSS', 'JavaScript'],
    soft: ['Communication', 'Problem Solving', 'Teamwork'],
    tools: ['Git', 'GitHub', 'VS Code'],
    languages: ['Python', 'Java', 'C++'],
  },
  certifications: [],
  achievements: [],
  interests: [{ id: 'demo-interest', name: 'AI-powered web applications', description: '' }],
  languages: [{ id: 'demo-language', name: 'English', proficiency: 'Professional' }],
}

let demoProfile: UserProfileData = normalizeProfile(demoProfileData)
let demoProfilePhoto: string | null = null
const demoResumes = new Map<string, Resume>()

export function isDemoMode() {
  const firebaseConfigured = Boolean(process.env.NEXT_PUBLIC_FIREBASE_API_KEY && process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID)
  const supabaseConfigured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  return process.env.NODE_ENV !== 'production' && !firebaseConfigured && !supabaseConfigured
}

export async function hasDemoSession() {
  return (await cookies()).get(DEMO_COOKIE)?.value === '1'
}

export async function setDemoSession() {
  const store = await cookies()
  store.set(DEMO_COOKIE, '1', { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/' })
}

export async function clearDemoSession() {
  const store = await cookies()
  store.delete(DEMO_COOKIE)
}

export function getDemoUser() {
  return {
    id: DEMO_USER_ID,
    email: DEMO_EMAIL,
    user_metadata: { full_name: demoProfile.personal.fullName },
  }
}

export function getDemoProfile(): UserProfile {
  return {
    id: DEMO_USER_ID,
    data: normalizeProfile(demoProfile),
    photoPath: null,
    photoUrl: demoProfilePhoto,
    updatedAt: new Date().toISOString(),
  }
}

export function setDemoProfile(data: UserProfileData) {
  demoProfile = normalizeProfile(data)
}

export function setDemoProfilePhoto(photoUrl: string | null) {
  demoProfilePhoto = photoUrl
}

export function getDemoResumes() {
  return [...demoResumes.values()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

export function getDemoResume(id: string) {
  return demoResumes.get(id) ?? null
}

export function createDemoResume(jobTarget: JobTarget): Resume {
  const now = new Date().toISOString()
  const id = newId()
  const resume: Resume = {
    id,
    userId: DEMO_USER_ID,
    title: `${jobTarget.jobTitle} — ${jobTarget.companyName}`,
    template: 'modern',
    status: 'draft',
    jobTarget: normalizeJobTarget(jobTarget),
    analysis: null,
    content: null,
    createdAt: now,
    updatedAt: now,
  }
  demoResumes.set(id, resume)
  return resume
}

export function updateDemoResume(id: string, patch: Partial<Resume>) {
  const current = demoResumes.get(id)
  if (!current) return null
  const updated = { ...current, ...patch, updatedAt: new Date().toISOString() }
  demoResumes.set(id, updated)
  return updated
}

export function deleteDemoResume(id: string) {
  return demoResumes.delete(id)
}

export function duplicateDemoResume(id: string) {
  const current = demoResumes.get(id)
  if (!current) return null
  const copy = { ...current, id: newId(), title: `${current.title} (copy)`, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
  demoResumes.set(copy.id, copy)
  return copy
}
